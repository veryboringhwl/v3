import { loadRemoteModules, type Module, type ModuleInstance, RootModule } from "/hooks/module.ts";
import { compare, parse } from "/hooks/std/semver.ts";
import { t } from "../../../shared/i18n.ts";
import type {
  MarketplaceActionDescriptor,
  MarketplaceActionKind,
  MarketplaceBatchResult,
  MarketplaceCatalogItem,
} from "../types.ts";
import {
  flattenDependencyTrees,
  getEnabledDependencies,
  getInstanceGeneratorsDependencyCandidates,
} from "./dependencyGraph.ts";

let remoteCatalogPromise: Promise<void> | null = null;

const compareVersionsDesc = (leftVersion: string, rightVersion: string) => {
  try {
    return compare(parse(rightVersion), parse(leftVersion));
  } catch {
    return rightVersion.localeCompare(leftVersion, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
};

const ensureRemoteCatalogLoaded = async () => {
  if (!remoteCatalogPromise) {
    remoteCatalogPromise = loadRemoteModules().catch(() => {
      // Keep marketplace usable with already-known modules when remote catalog fetch fails.
      remoteCatalogPromise = null;
    });
  }

  await remoteCatalogPromise;
};

const isExcludedModule = (identifier: string) => {
  return identifier === "Spotify";
};

const sortInstancesByPreference = (instances: ModuleInstance[]) => {
  return [...instances].sort((left, right) => {
    if (left.isEnabled() !== right.isEnabled()) {
      return left.isEnabled() ? -1 : 1;
    }

    if (left.isInstalled() !== right.isInstalled()) {
      return left.isInstalled() ? -1 : 1;
    }

    return compareVersionsDesc(left.getVersion(), right.getVersion());
  });
};

const selectDisplayInstance = (
  module: Module,
  instances: ModuleInstance[],
): ModuleInstance | null => {
  const enabled = module.getEnabledInstance();
  if (enabled) {
    return enabled;
  }

  if (!instances.length) {
    return null;
  }

  const installed = instances.find((instance) => instance.isInstalled());
  return installed ?? instances[0];
};

const hydrateMetadata = async (instance: ModuleInstance) => {
  if (instance.metadata) {
    return;
  }

  try {
    await instance.ensureMetadata();
  } catch {
    // Ignore metadata fetch failures so the marketplace can still render.
  }
};

const displayName = (item: MarketplaceCatalogItem) => {
  return item.metadata?.name ?? item.identifier;
};

export const getCatalogKey = (item: Pick<MarketplaceCatalogItem, "identifier" | "version">) =>
  `${item.identifier}@${item.version}`;

const resolveEnablePlan = async (
  selectedItems: MarketplaceCatalogItem[],
): Promise<ModuleInstance[]> => {
  const enabledDependencies = getEnabledDependencies();
  for (const item of selectedItems) {
    enabledDependencies.delete(item.instance.getModuleIdentifier());
  }

  const selectedInstanceGenerators = selectedItems.map((item) =>
    (async function* () {
      yield item.instance;
    })(),
  );

  for await (const candidate of getInstanceGeneratorsDependencyCandidates(
    selectedInstanceGenerators,
    enabledDependencies,
  )) {
    return flattenDependencyTrees(candidate);
  }

  throw new Error(t("marketplace.errors.resolveDependency"));
};

export const enableItemsWithDependencies = async (
  selectedItems: MarketplaceCatalogItem[],
): Promise<MarketplaceBatchResult> => {
  if (!selectedItems.length) {
    return { ok: true, enabledCount: 0 };
  }

  let plan: ModuleInstance[];
  try {
    plan = await resolveEnablePlan(selectedItems);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : t("marketplace.errors.resolveDependency"),
    };
  }

  let enabledCount = 0;

  for (const instance of plan) {
    if (!instance.isInstalled()) {
      const installed = await instance.fastInstall();
      if (!installed) {
        return {
          ok: false,
          error: t("marketplace.errors.installFailed", {
            module: instance.getIdentifier(),
          }),
          enabledCount,
        };
      }
    }

    if (instance.isEnabled()) {
      enabledCount += 1;
      continue;
    }

    const enabled = await instance.getModule().fastEnable(instance);
    if (!enabled) {
      return {
        ok: false,
        error: t("marketplace.errors.enableFailed", {
          module: instance.getIdentifier(),
        }),
        enabledCount,
      };
    }

    enabledCount += 1;
  }

  // UX contract: enabling a module should make it run immediately.
  // Loading selected modules recursively loads their dependencies.
  for (const item of selectedItems) {
    const enabledInstance = item.module.getEnabledInstance();
    if (!enabledInstance) {
      return {
        ok: false,
        error: t("marketplace.errors.missingEnabledInstance", {
          module: item.identifier,
        }),
        enabledCount,
      };
    }

    if (enabledInstance.isLoaded()) {
      continue;
    }

    const loaded = await enabledInstance.load();
    if (!loaded) {
      return {
        ok: false,
        error: t("marketplace.errors.loadAfterEnableFailed", {
          module: item.identifier,
        }),
        enabledCount,
      };
    }
  }

  return { ok: true, enabledCount };
};

export const loadMarketplaceCatalog = async (): Promise<MarketplaceCatalogItem[]> => {
  await ensureRemoteCatalogLoaded();

  const modules = Array.from(RootModule.INSTANCE.getDescendantsByDepth()) as Module[];

  const items = modules
    .filter((module) => !isExcludedModule(module.getIdentifier()))
    .map((module) => {
      const instances = sortInstancesByPreference(Array.from(module.instances.values()));
      const instance = selectDisplayInstance(module, instances);
      if (!instance) {
        return null;
      }

      return {
        identifier: module.getIdentifier(),
        module,
        instance,
        instances,
        metadata: instance.metadata,
        version: instance.getVersion(),
      } as MarketplaceCatalogItem;
    })
    .filter((item): item is MarketplaceCatalogItem => item !== null);

  await Promise.allSettled(items.map((item) => hydrateMetadata(item.instance)));

  return items
    .map((item) => ({
      ...item,
      metadata: item.instance.metadata,
      version: item.instance.getVersion(),
    }))
    .sort((left, right) => {
      const nameCmp = displayName(left).localeCompare(displayName(right), undefined, {
        sensitivity: "base",
      });
      if (nameCmp !== 0) {
        return nameCmp;
      }

      return compareVersionsDesc(left.version, right.version);
    });
};

export const getPrimaryAction = (item: MarketplaceCatalogItem): MarketplaceActionDescriptor => {
  if (item.instance.isEnabled()) {
    return { kind: "disable", label: t("marketplace.actions.disable") };
  }

  if (!item.instance.isInstalled()) {
    return { kind: "enable", label: t("marketplace.actions.enable") };
  }

  return { kind: "enable", label: t("marketplace.actions.enable") };
};

export const getSecondaryAction = (
  item: MarketplaceCatalogItem,
): MarketplaceActionDescriptor | null => {
  if (item.instance.isInstalled()) {
    return { kind: "delete", label: t("marketplace.actions.uninstall") };
  }

  if (item.instance.canInstallRemove()) {
    return { kind: "remove", label: t("marketplace.actions.forget") };
  }

  return null;
};

export const getRuntimeAction = (
  item: MarketplaceCatalogItem,
): MarketplaceActionDescriptor | null => {
  if (!item.instance.isInstalled() || !item.instance.isEnabled()) {
    return null;
  }

  if (item.instance.isLoaded()) {
    return {
      kind: "unload",
      label: t("marketplace.actions.unload"),
      disabled: !item.instance.canUnload(),
    };
  }

  return {
    kind: "load",
    label: t("marketplace.actions.load"),
    disabled: !item.instance.canLoad(),
  };
};

const ensureUnloaded = async (instance: ModuleInstance): Promise<boolean> => {
  if (!instance.isLoaded()) {
    return true;
  }

  if (!instance.canUnload()) {
    return false;
  }

  await instance.unload();
  return !instance.isLoaded();
};

const disableInstance = async (item: MarketplaceCatalogItem): Promise<boolean> => {
  if (!item.instance.isEnabled()) {
    return true;
  }

  if (!(await ensureUnloaded(item.instance))) {
    return false;
  }

  if (!item.module.canDisable(item.instance)) {
    return false;
  }

  return await item.module.disable();
};

const deleteInstance = async (item: MarketplaceCatalogItem): Promise<boolean> => {
  if (!(await disableInstance(item))) {
    return false;
  }

  if (!(await ensureUnloaded(item.instance))) {
    return false;
  }

  if (item.instance.canDelete()) {
    return !!(await item.instance.fastDelete());
  }

  if (item.instance.canInstallRemove()) {
    return !!(await item.instance.remove());
  }

  return false;
};

export const executeMarketplaceAction = async (
  item: MarketplaceCatalogItem,
  actionKind: MarketplaceActionKind,
): Promise<boolean> => {
  switch (actionKind) {
    case "add": {
      if (!item.instance.canAdd()) {
        return item.instance.isLocal();
      }

      return !!(await item.instance.add());
    }
    case "install": {
      if (item.instance.isInstalled()) {
        return true;
      }

      return !!(await item.instance.fastInstall());
    }
    case "enable": {
      const result = await enableItemsWithDependencies([item]);
      if (!result.ok && result.error) {
        throw new Error(result.error);
      }
      return result.ok;
    }
    case "disable": {
      return await disableInstance(item);
    }
    case "load": {
      if (item.instance.isLoaded()) {
        return true;
      }

      if (!item.instance.canLoad()) {
        return false;
      }

      return !!(await item.instance.load());
    }
    case "unload": {
      if (!item.instance.isLoaded()) {
        return true;
      }

      if (!item.instance.canUnload()) {
        return false;
      }

      return !!(await item.instance.unload());
    }
    case "delete": {
      return await deleteInstance(item);
    }
    case "remove": {
      if (item.instance.isInstalled()) {
        if (!(await ensureUnloaded(item.instance))) {
          return false;
        }

        const removed = await item.instance.fastRemove();
        if (removed) {
          return true;
        }
      }

      if (item.instance.canInstallRemove()) {
        return !!(await item.instance.remove());
      }

      return false;
    }
    case "none": {
      return false;
    }
  }
};

import type { Module, ModuleInstance } from "/hooks/module.ts";
import { RootModule } from "/hooks/module.ts";
import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { useLocation, useMatch } from "/modules/stdlib/src/webpack/ReactRouter.ts";
import { t } from "../../../shared/i18n.ts";
import {
  executeMarketplaceAction,
  getPrimaryAction,
  getSecondaryAction,
} from "../../catalog/services/catalogService.ts";
import type { MarketplaceCatalogItem } from "../../catalog/types.ts";
import { RemoteMarkdown } from "./RemoteMarkdown.tsx";

const parseArtifactPath = (artifactUrl: string) => {
  const cleanArtifactUrl = artifactUrl.split("?")[0].split("#")[0];
  const basename = cleanArtifactUrl.slice(cleanArtifactUrl.lastIndexOf("/") + 1);
  const match = basename.match(/^(?<moduleIdentifier>[^@]+)@(?<version>[^@]+)\.zip$/);
  if (!match?.groups) {
    return null;
  }

  const rawIdentifier = match.groups.moduleIdentifier;

  return {
    moduleIdentifier: rawIdentifier,
    version: match.groups.version,
  };
};

const isAbsoluteHttpUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const stripSearchAndHash = (value: string) => value.split("#")[0].split("?")[0];

const resolveReadmeUrl = (metadataUrl: string | null, readmePath: string | undefined) => {
  if (!readmePath) {
    return null;
  }

  if (isAbsoluteHttpUrl(readmePath) || readmePath.startsWith("/")) {
    return readmePath;
  }

  if (!metadataUrl) {
    return null;
  }

  const cleanMetadataUrl = stripSearchAndHash(metadataUrl);

  if (isAbsoluteHttpUrl(cleanMetadataUrl)) {
    try {
      return new URL(readmePath, cleanMetadataUrl).toString();
    } catch {
      return null;
    }
  }

  const lastSlash = cleanMetadataUrl.lastIndexOf("/");
  if (lastSlash < 0) {
    return null;
  }

  const metadataDir = cleanMetadataUrl.slice(0, lastSlash + 1);
  return `${metadataDir}${readmePath.replace(/^\.\//, "")}`;
};

const createCatalogItem = (instance: ModuleInstance): MarketplaceCatalogItem => {
  const module = instance.getModule() as Module;
  const instances = Array.from(module.instances.values());

  return {
    identifier: module.getIdentifier(),
    module,
    instance,
    instances,
    metadata: instance.metadata,
    version: instance.getVersion(),
  };
};

const hydrateMetadata = async (instance: ModuleInstance) => {
  if (instance.metadata) {
    return;
  }

  try {
    await instance.ensureMetadata();
  } catch {
    // Keep page functional even when metadata endpoint fails.
  }
};

const resolveMarketplaceInstance = async (
  moduleIdentifier: string,
  version: string,
  artifactUrl: string,
): Promise<ModuleInstance> => {
  const localModule = RootModule.INSTANCE.getDescendant(moduleIdentifier);
  const localInstance = localModule?.instances.get(version);
  if (localInstance) {
    await hydrateMetadata(localInstance);
    return localInstance;
  }

  const module = await RootModule.INSTANCE.getDescendantOrNew(moduleIdentifier);
  const existing = module.instances.get(version);
  if (existing) {
    await hydrateMetadata(existing);
    return existing;
  }

  const remoteInstance = await module.newInstance(version, {
    installed: false,
    artifacts: [artifactUrl],
    checksum: "",
  });

  await hydrateMetadata(remoteInstance);
  return remoteInstance;
};

export const ModulePage = () => {
  const routeMatch = useMatch("/bespoke/marketplace/module/:aurl");
  const location = useLocation();

  const artifactUrl = React.useMemo(
    () => decodeURIComponent(routeMatch?.params?.aurl ?? ""),
    [routeMatch?.params?.aurl],
  );

  const query = React.useMemo(
    () => new URLSearchParams(location?.search ?? ""),
    [location?.search],
  );

  const parsedArtifact = React.useMemo(() => parseArtifactPath(artifactUrl), [artifactUrl]);

  const moduleIdentifier = query.get("id") ?? parsedArtifact?.moduleIdentifier ?? "";
  const version = query.get("version") ?? parsedArtifact?.version ?? "";

  const [item, setItem] = React.useState<MarketplaceCatalogItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isActionPending, setIsActionPending] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!artifactUrl || !moduleIdentifier || !version) {
      setErrorMessage(t("marketplace.state.invalidModuleRoute"));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resolvedInstance = await resolveMarketplaceInstance(
        moduleIdentifier,
        version,
        artifactUrl,
      );
      setItem(createCatalogItem(resolvedInstance));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("marketplace.errors.loadModuleDetails"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [artifactUrl, moduleIdentifier, version]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = React.useCallback(async () => {
    if (!item) {
      return;
    }

    const primaryAction = getPrimaryAction(item);
    if (primaryAction.kind === "none") {
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);

    try {
      const hasSucceeded = await executeMarketplaceAction(item, primaryAction.kind);
      if (!hasSucceeded) {
        setErrorMessage(
          t("marketplace.errors.actionFailed", {
            action: primaryAction.label,
            module: item.identifier,
            version: item.version,
          }),
        );
        return;
      }

      await refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("marketplace.errors.runModuleAction"),
      );
    } finally {
      setIsActionPending(false);
    }
  }, [item, refresh]);

  const runSecondaryAction = React.useCallback(async () => {
    if (!item) {
      return;
    }

    const secondaryAction = getSecondaryAction(item);
    if (!secondaryAction) {
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);

    try {
      const hasSucceeded = await executeMarketplaceAction(item, secondaryAction.kind);
      if (!hasSucceeded) {
        setErrorMessage(
          t("marketplace.errors.actionFailed", {
            action: secondaryAction.label,
            module: item.identifier,
            version: item.version,
          }),
        );
        return;
      }

      await refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("marketplace.errors.runModuleAction"),
      );
    } finally {
      setIsActionPending(false);
    }
  }, [item, refresh]);

  if (!artifactUrl || !moduleIdentifier || !version) {
    return (
      <section className="mkp-module contentSpacing">
        <div className="mkp-state mkp-state--error" role="status">
          <p>{t("marketplace.state.invalidModuleRoute")}</p>
        </div>
      </section>
    );
  }

  const metadata = item?.metadata;
  const title = metadata?.name ?? t("marketplace.modulePage.title");
  const readmeUrl = resolveReadmeUrl(item?.instance.getMetadataURL() ?? null, metadata?.readme);

  const primaryAction = item ? getPrimaryAction(item) : null;
  const secondaryAction = item ? getSecondaryAction(item) : null;

  return (
    <section className="mkp-module contentSpacing">
      <header className="mkp-module__header marketplace-header">
        <div className="mkp-module__title-group">
          <button
            className="mkp-btn mkp-btn--ghost"
            onClick={() => Platform.getHistory().push("/bespoke/marketplace/", null)}
            type="button"
          >
            {t("marketplace.actions.back")}
          </button>
          <h1 className="mkp-module__title">{title}</h1>
        </div>
        <div className="mkp-module__actions">
          {primaryAction && (
            <button
              className="mkp-btn mkp-btn--primary"
              disabled={isActionPending || !!primaryAction.disabled || !item}
              onClick={() => void runAction()}
              type="button"
            >
              {isActionPending ? t("marketplace.state.working") : primaryAction.label}
            </button>
          )}
          {secondaryAction && item && (
            <button
              className="mkp-btn mkp-btn--ghost"
              disabled={isActionPending || !!secondaryAction.disabled}
              onClick={() => void runSecondaryAction()}
              type="button"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="mkp-state" role="status">
          {t("marketplace.state.loadingModuleDetails")}
        </div>
      )}

      {errorMessage && (
        <div className="mkp-state mkp-state--error" role="status">
          <p>{errorMessage}</p>
        </div>
      )}

      <article className="mkp-module__readme-wrap">
        <RemoteMarkdown
          emptyText={metadata?.description ?? t("marketplace.state.noReadme")}
          url={readmeUrl ?? undefined}
        />
      </article>
    </section>
  );
};

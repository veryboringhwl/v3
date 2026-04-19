import { React } from "/modules/stdlib/src/expose/React.ts";
import { t } from "../../../shared/i18n.ts";
// import { enqueueSnackbar } from "/modules/stdlib/src/webpack/Snackbar.ts";
import {
  enableItemsWithDependencies,
  executeMarketplaceAction,
  getCatalogKey,
  getPrimaryAction,
  getRuntimeAction,
  getSecondaryAction,
  loadMarketplaceCatalog,
} from "../services/catalogService.ts";
import type { MarketplaceActionKind, MarketplaceCatalogItem } from "../types.ts";

const getActionKey = (item: MarketplaceCatalogItem) => {
  return getCatalogKey(item);
};

const getActionLabel = (actionKind: MarketplaceActionKind) => {
  switch (actionKind) {
    case "add":
      return t("marketplace.actions.add");
    case "install":
      return t("marketplace.actions.install");
    case "enable":
      return t("marketplace.actions.enable");
    case "disable":
      return t("marketplace.actions.disable");
    case "load":
      return t("marketplace.actions.load");
    case "unload":
      return t("marketplace.actions.unload");
    case "delete":
      return t("marketplace.actions.delete");
    case "remove":
      return t("marketplace.actions.remove");
    case "none":
      return "";
  }
};

export const useMarketplaceCatalog = () => {
  const [items, setItems] = React.useState<MarketplaceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = React.useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const [preferredVersionsByIdentifier, setPreferredVersionsByIdentifier] = React.useState<
    Record<string, string>
  >({});
  const [isBatchEnabling, setIsBatchEnabling] = React.useState(false);
  const [batchError, setBatchError] = React.useState<string | null>(null);
  const [batchMessage, setBatchMessage] = React.useState<string | null>(null);

  const applyPreferredVersions = React.useCallback(
    (catalogItems: MarketplaceCatalogItem[]) => {
      return catalogItems.map((item) => {
        const preferredVersion = preferredVersionsByIdentifier[item.identifier];
        if (!preferredVersion) {
          return item;
        }

        const preferredInstance = item.instances.find(
          (instance) => instance.getVersion() === preferredVersion,
        );
        if (!preferredInstance) {
          return item;
        }

        return {
          ...item,
          instance: preferredInstance,
          metadata: preferredInstance.metadata,
          version: preferredInstance.getVersion(),
        };
      });
    },
    [preferredVersionsByIdentifier],
  );

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextItems = await loadMarketplaceCatalog();
      setItems(applyPreferredVersions(nextItems));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("marketplace.errors.loadCatalog");
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [applyPreferredVersions]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    setSelectedKeys((currentKeys) => {
      const available = new Set(items.map((item) => getCatalogKey(item)));
      return currentKeys.filter((key) => available.has(key));
    });
  }, [items]);

  const runAction = React.useCallback(
    async (item: MarketplaceCatalogItem, actionKind: MarketplaceActionKind) => {
      if (actionKind === "none") {
        return;
      }

      const actionKey = getActionKey(item);
      setPendingActionKey(actionKey);
      setErrorMessage(null);

      try {
        const hasSucceeded = await executeMarketplaceAction(item, actionKind);

        if (!hasSucceeded) {
          const message = t("marketplace.errors.actionFailed", {
            action: getActionLabel(actionKind) || actionKind,
            module: item.identifier,
            version: item.version,
          });
          setErrorMessage(message);
          return;
        }

        await refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t("marketplace.errors.actionFailed", {
                action: getActionLabel(actionKind) || actionKind,
                module: item.identifier,
                version: item.version,
              });
        setErrorMessage(message);
      } finally {
        setPendingActionKey(null);
      }
    },
    [refresh],
  );

  const isActionPending = React.useCallback(
    (item: MarketplaceCatalogItem) => pendingActionKey === getActionKey(item),
    [pendingActionKey],
  );

  const selectedItems = React.useMemo(() => {
    const selectedKeySet = new Set(selectedKeys);
    return items.filter((item) => selectedKeySet.has(getCatalogKey(item)));
  }, [items, selectedKeys]);

  const isSelected = React.useCallback(
    (item: MarketplaceCatalogItem) => selectedKeys.includes(getCatalogKey(item)),
    [selectedKeys],
  );

  const toggleSelected = React.useCallback((item: MarketplaceCatalogItem) => {
    const key = getCatalogKey(item);

    setSelectedKeys((currentKeys) => {
      if (currentKeys.includes(key)) {
        return currentKeys.filter((currentKey) => currentKey !== key);
      }

      return [...currentKeys, key];
    });
  }, []);

  const selectMany = React.useCallback((itemsToSelect: MarketplaceCatalogItem[]) => {
    const selected = itemsToSelect.map((item) => getCatalogKey(item));

    setSelectedKeys((currentKeys) => Array.from(new Set([...currentKeys, ...selected])));
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedKeys([]);
  }, []);

  const setSelectionKeys = React.useCallback((nextKeys: string[]) => {
    setSelectedKeys(Array.from(new Set(nextKeys)));
  }, []);

  const selectOnly = React.useCallback((item: MarketplaceCatalogItem) => {
    setSelectedKeys([getCatalogKey(item)]);
  }, []);

  const selectVersion = React.useCallback(async (item: MarketplaceCatalogItem, version: string) => {
    const selectedInstance = item.instances.find((instance) => instance.getVersion() === version);
    if (!selectedInstance) {
      return;
    }

    const previousKey = getCatalogKey(item);
    const nextKey = `${item.identifier}@${version}`;

    setSelectedKeys((currentKeys) => {
      if (!currentKeys.includes(previousKey)) {
        return currentKeys;
      }

      return Array.from(new Set(currentKeys.map((key) => (key === previousKey ? nextKey : key))));
    });

    setPreferredVersionsByIdentifier((current) => ({
      ...current,
      [item.identifier]: version,
    }));

    setItems((currentItems) =>
      currentItems.map((currentItem) => {
        if (currentItem.identifier !== item.identifier) {
          return currentItem;
        }

        return {
          ...currentItem,
          instance: selectedInstance,
          metadata: selectedInstance.metadata,
          version: selectedInstance.getVersion(),
        };
      }),
    );

    if (selectedInstance.metadata) {
      return;
    }

    try {
      await selectedInstance.ensureMetadata();
    } catch {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((currentItem) => {
        if (
          currentItem.identifier !== item.identifier ||
          currentItem.instance.getVersion() !== selectedInstance.getVersion()
        ) {
          return currentItem;
        }

        return {
          ...currentItem,
          metadata: selectedInstance.metadata,
        };
      }),
    );
  }, []);

  const enableSelected = React.useCallback(async () => {
    if (!selectedItems.length) {
      return;
    }

    setBatchError(null);
    setBatchMessage(null);
    setIsBatchEnabling(true);

    try {
      const result = await enableItemsWithDependencies(selectedItems);
      if (!result.ok) {
        const message = result.error ?? t("marketplace.errors.resolveDependency");
        setBatchError(message);
        return;
      }

      const enabledCount = result.enabledCount ?? 0;
      setBatchMessage(
        enabledCount === 1
          ? t("marketplace.batch.enabledAndLoadedSingle")
          : t("marketplace.batch.enabledAndLoadedMany", { count: enabledCount }),
      );

      await refresh();
      setSelectedKeys([]);
    } finally {
      setIsBatchEnabling(false);
    }
  }, [refresh, selectedItems]);

  return {
    items,
    isLoading,
    errorMessage,
    refresh,
    runAction,
    isActionPending,
    getPrimaryAction,
    getSecondaryAction,
    getRuntimeAction,
    selectedItems,
    selectedKeys,
    selectedCount: selectedItems.length,
    isSelected,
    selectOnly,
    setSelectionKeys,
    toggleSelected,
    selectMany,
    clearSelection,
    selectVersion,
    enableSelected,
    isBatchEnabling,
    batchError,
    batchMessage,
  };
};

import {
  getProp,
  type RTree,
  TreeNodeVal,
  useChipFilter,
  useDropdown,
  useSearchBar,
} from "/modules/stdlib/lib/components/index.tsx";
import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { t } from "../../../shared/i18n.ts";
import {
  getHideCoreModules,
  subscribeHideCoreModules,
} from "../../../shared/marketplaceSettings.ts";
import { useMarketplaceCatalog } from "../hooks/useMarketplaceCatalog.ts";
import { getCatalogKey } from "../services/catalogService.ts";
import type { MarketplaceCatalogItem } from "../types.ts";
import { ModuleCard } from "./ModuleCard.tsx";
import { VersionControlsDialog } from "./VersionControlsDialog.tsx";

const SortOptions = {
  default: () => t("marketplace.sort.default"),
  "a-z": () => t("marketplace.sort.a-z"),
  "z-a": () => t("marketplace.sort.z-a"),
  random: () => t("marketplace.sort.random"),
};

const sortLabel = (item: MarketplaceCatalogItem) => item.metadata?.name ?? item.identifier;

const SortFns: Record<
  keyof typeof SortOptions,
  null | ((left: MarketplaceCatalogItem, right: MarketplaceCatalogItem) => number)
> = {
  default: null,
  "a-z": (left, right) =>
    sortLabel(left).localeCompare(sortLabel(right), undefined, {
      sensitivity: "base",
    }),
  "z-a": (left, right) =>
    sortLabel(right).localeCompare(sortLabel(left), undefined, {
      sensitivity: "base",
    }),
  random: () => Math.random() - 0.5,
};

const hasTag = (item: MarketplaceCatalogItem, tag: string) =>
  item.metadata?.tags.includes(tag) ?? false;

const coreModuleNames = new Set(["stdlib", "marketplace"]);
const isCoreModuleItem = (item: MarketplaceCatalogItem) => {
  const normalizedIdentifier = item.identifier.toLowerCase().replace(/^\/+/, "");
  const tail = normalizedIdentifier.split("/").at(-1) ?? normalizedIdentifier;
  return coreModuleNames.has(tail);
};

const enabledFilterLabels = { enabled: { [TreeNodeVal]: t("marketplace.filters.enabled") } };
const enabledFilterFns = {
  enabled: {
    [TreeNodeVal]: (item: MarketplaceCatalogItem) => item.instance.isLoaded(),
  },
};

export const MarketplacePage = () => {
  const {
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
    selectedCount,
    isSelected,
    toggleSelected,
    selectMany,
    clearSelection,
    enableSelected,
    isBatchEnabling,
    batchError,
    batchMessage,
    selectedKeys,
    setSelectionKeys,
    selectOnly,
    selectVersion,
  } = useMarketplaceCatalog();

  const lastSelectedKeyRef = React.useRef<string | null>(null);
  const [hideCoreModules, setHideCoreModules] = React.useState(() => getHideCoreModules());
  const [isVersionDialogOpen, setVersionDialogOpen] = React.useState(false);

  React.useEffect(() => {
    return subscribeHideCoreModules(setHideCoreModules);
  }, []);

  const availableFilters = React.useMemo(
    () => ({
      [TreeNodeVal]: null,
      themes: { [TreeNodeVal]: t("marketplace.filters.themes"), ...enabledFilterLabels },
      extensions: { [TreeNodeVal]: t("marketplace.filters.extensions"), ...enabledFilterLabels },
      apps: { [TreeNodeVal]: t("marketplace.filters.apps"), ...enabledFilterLabels },
      snippets: { [TreeNodeVal]: t("marketplace.filters.snippets"), ...enabledFilterLabels },
      libs: { [TreeNodeVal]: t("marketplace.filters.libs"), ...enabledFilterLabels },
    }),
    [],
  );

  const filterFns = React.useMemo<RTree<(item: MarketplaceCatalogItem) => boolean>>(
    () => ({
      [TreeNodeVal]: (item) => {
        if (hideCoreModules && isCoreModuleItem(item)) {
          return false;
        }

        return true;
      },
      themes: {
        [TreeNodeVal]: (item) => hasTag(item, "theme"),
        ...enabledFilterFns,
      },
      apps: {
        [TreeNodeVal]: (item) => hasTag(item, "app"),
        ...enabledFilterFns,
      },
      extensions: {
        [TreeNodeVal]: (item) => hasTag(item, "extension"),
        ...enabledFilterFns,
      },
      snippets: {
        [TreeNodeVal]: (item) => hasTag(item, "snippet"),
        ...enabledFilterFns,
      },
      libs: {
        [TreeNodeVal]: (item) => hasTag(item, "lib"),
        ...enabledFilterFns,
      },
    }),
    [hideCoreModules],
  );

  const [searchbar, search] = useSearchBar({
    placeholder: t("marketplace.search.placeholder"),
    expanded: true,
  });

  const [sortbox, sortOption] = useDropdown({ options: SortOptions });
  const sortFn = SortFns[sortOption];

  const [chipFilter, selectedFilters] = useChipFilter(availableFilters);

  const selectedFilterFns = React.useMemo(
    () =>
      selectedFilters.map(
        ({ key }) =>
          getProp(filterFns, key) as {
            [TreeNodeVal]: (item: MarketplaceCatalogItem) => boolean;
          },
      ),
    [filterFns, selectedFilters],
  );

  const visibleItems = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filteredByChips = selectedFilterFns.reduce(
      (accumulator, filter) => accumulator.filter(filter[TreeNodeVal]),
      items,
    );

    const filteredBySearch = filteredByChips.filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        item.identifier,
        item.version,
        item.metadata?.name ?? "",
        item.metadata?.description ?? "",
        ...(item.metadata?.authors ?? []),
        ...(item.metadata?.tags ?? []),
      ];

      return searchableFields.some((field) => field.toLowerCase().includes(normalizedSearch));
    });

    if (!sortFn) {
      return filteredBySearch;
    }

    return [...filteredBySearch].sort(sortFn);
  }, [items, search, selectedFilterFns, sortFn]);

  const openDetails = React.useCallback((item: MarketplaceCatalogItem) => {
    const artifactUrl = item.instance.getRemoteArtifactURL();
    if (!artifactUrl) {
      return;
    }

    const encodedArtifactUrl = encodeURIComponent(artifactUrl);
    const query = new URLSearchParams({
      id: item.identifier,
      version: item.version,
    });

    Platform.getHistory().push(
      `/bespoke/marketplace/module/${encodedArtifactUrl}?${query.toString()}`,
      null,
    );
  }, []);

  const onCardSelectGesture = React.useCallback(
    (item: MarketplaceCatalogItem, event: React.MouseEvent<HTMLElement>) => {
      const key = getCatalogKey(item);
      const visibleKeys = visibleItems.map(getCatalogKey);

      if (event.shiftKey) {
        const fallbackAnchor = selectedKeys[selectedKeys.length - 1] ?? null;
        const anchor =
          lastSelectedKeyRef.current && visibleKeys.includes(lastSelectedKeyRef.current)
            ? lastSelectedKeyRef.current
            : fallbackAnchor;
        const currentIndex = visibleKeys.indexOf(key);
        const anchorIndex = anchor ? visibleKeys.indexOf(anchor) : currentIndex;

        if (currentIndex !== -1 && anchorIndex !== -1) {
          const [start, end] = [
            Math.min(anchorIndex, currentIndex),
            Math.max(anchorIndex, currentIndex),
          ];
          const rangeKeys = visibleKeys.slice(start, end + 1);
          setSelectionKeys([...selectedKeys, ...rangeKeys]);
          lastSelectedKeyRef.current = key;
          return;
        }
      }

      if (event.ctrlKey || event.metaKey) {
        toggleSelected(item);
        lastSelectedKeyRef.current = key;
        return;
      }

      if (isSelected(item)) {
        clearSelection();
        lastSelectedKeyRef.current = null;
        return;
      }

      selectOnly(item);
      lastSelectedKeyRef.current = key;
    },
    [
      clearSelection,
      isSelected,
      selectOnly,
      selectedKeys,
      setSelectionKeys,
      toggleSelected,
      visibleItems,
    ],
  );

  const onToggleSelected = React.useCallback(
    (item: MarketplaceCatalogItem, event?: React.MouseEvent<HTMLElement>) => {
      if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
        onCardSelectGesture(item, event);
        return;
      }

      toggleSelected(item);
      lastSelectedKeyRef.current = getCatalogKey(item);
    },
    [onCardSelectGesture, toggleSelected],
  );

  return (
    <section className="mkp-page contentSpacing">
      <div className="marketplace-header">
        <div className="marketplace-header__left">{chipFilter}</div>
        <div className="marketplace-header__right">
          <p className="mkp-toolbar__sort-label">{t("marketplace.sort.label")}</p>
          {sortbox}
          {searchbar}
          <button className="mkp-btn mkp-btn--ghost" onClick={() => void refresh()} type="button">
            {t("marketplace.toolbar.refresh")}
          </button>
        </div>
      </div>

      <div className="mkp-selection-toolbar" role="group">
        <div className="mkp-page__stats">
          {t("marketplace.selection.modulesCount", { count: visibleItems.length })}
        </div>
        <div className="mkp-selection-toolbar__actions">
          <button
            className="mkp-btn mkp-btn--primary"
            disabled={isBatchEnabling || selectedCount === 0}
            onClick={() => void enableSelected()}
            type="button"
          >
            {isBatchEnabling
              ? t("marketplace.selection.enabling")
              : selectedCount > 0
                ? t("marketplace.selection.enableSelectedCount", {
                    count: selectedCount,
                  })
                : t("marketplace.selection.enableSelected")}
          </button>
          <button
            className="mkp-btn mkp-btn--ghost"
            onClick={() => setVersionDialogOpen(true)}
            type="button"
          >
            {t("marketplace.toolbar.versionControls")}
          </button>
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={visibleItems.length === 0}
            onClick={() => selectMany(visibleItems)}
            type="button"
          >
            {t("marketplace.toolbar.selectVisible")}
          </button>
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={selectedCount === 0}
            onClick={clearSelection}
            type="button"
          >
            {t("marketplace.toolbar.clearSelection")}
          </button>
        </div>
      </div>

      {batchMessage && (
        <div className="mkp-state" role="status">
          {batchMessage}
        </div>
      )}

      {batchError && (
        <div className="mkp-state mkp-state--error" role="status">
          <p>{batchError}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mkp-state mkp-state--error" role="status">
          <p>{errorMessage}</p>
          <button className="mkp-btn mkp-btn--ghost" onClick={() => void refresh()} type="button">
            {t("marketplace.state.retry")}
          </button>
        </div>
      )}

      {isLoading && items.length === 0 && (
        <div className="mkp-state" role="status">
          {t("marketplace.state.loadingCatalog")}
        </div>
      )}

      {!isLoading && visibleItems.length === 0 && (
        <div className="mkp-state" role="status">
          {t("marketplace.state.noResults")}
        </div>
      )}

      <div className="marketplace-grid mkp-grid">
        {visibleItems.map((item) => {
          const primaryAction = getPrimaryAction(item);
          const secondaryAction = getSecondaryAction(item);
          const runtimeAction = getRuntimeAction(item);

          return (
            <ModuleCard
              isPending={isActionPending(item)}
              isSelected={isSelected(item)}
              item={item}
              key={item.identifier}
              onCardSelectGesture={onCardSelectGesture}
              onOpenDetails={openDetails}
              onRunAction={runAction}
              onSelectVersion={(card, version) => {
                void selectVersion(card, version);
              }}
              onToggleSelected={onToggleSelected}
              primaryAction={primaryAction}
              runtimeAction={runtimeAction}
              secondaryAction={secondaryAction}
            />
          );
        })}
      </div>

      <VersionControlsDialog
        isActionPending={isActionPending}
        isBatchEnabling={isBatchEnabling}
        isOpen={isVersionDialogOpen}
        items={items}
        onClose={() => setVersionDialogOpen(false)}
        onEnableSelected={() => void enableSelected()}
        onRunAction={(item, actionKind) => {
          void runAction(item, actionKind);
        }}
        onSelectVersion={(item, version) => {
          void selectVersion(item, version);
        }}
        selectedItems={selectedItems}
      />
    </section>
  );
};

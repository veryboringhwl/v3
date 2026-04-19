import { compare, parse, parseRange, satisfies } from "/hooks/std/semver.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { Dialog } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { t } from "../../../shared/i18n.ts";
import type { MarketplaceActionKind, MarketplaceCatalogItem } from "../types.ts";

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

const createVersionItem = (
  base: MarketplaceCatalogItem,
  instance: MarketplaceCatalogItem["instance"],
): MarketplaceCatalogItem => ({
  ...base,
  instance,
  metadata: instance.metadata,
  version: instance.getVersion(),
});

const buildSelectedMap = (selectedItems: MarketplaceCatalogItem[]) => {
  return Object.fromEntries(selectedItems.map((item) => [item.identifier, item]));
};

interface VersionControlsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: MarketplaceCatalogItem[];
  selectedItems: MarketplaceCatalogItem[];
  onRunAction: (item: MarketplaceCatalogItem, actionKind: MarketplaceActionKind) => void;
  onSelectVersion: (item: MarketplaceCatalogItem, version: string) => void;
  onEnableSelected: () => void;
  isActionPending: (item: MarketplaceCatalogItem) => boolean;
  isBatchEnabling: boolean;
}

export const VersionControlsDialog = ({
  isOpen,
  onClose,
  items,
  selectedItems,
  onRunAction,
  onSelectVersion,
  onEnableSelected,
  isActionPending,
  isBatchEnabling,
}: VersionControlsDialogProps) => {
  const itemsByIdentifier = React.useMemo(
    () => Object.fromEntries(items.map((item) => [item.identifier, item])),
    [items],
  );

  const selectedByIdentifier = React.useMemo(
    () => buildSelectedMap(selectedItems),
    [selectedItems],
  );

  const selectedIdentifiers = React.useMemo(
    () => Array.from(new Set(selectedItems.map((item) => item.identifier))),
    [selectedItems],
  );

  return (
    <Dialog animated={true} isOpen={isOpen} onClose={onClose} shouldCloseOnBackdropClick={true}>
      <div
        aria-label={t("marketplace.versionControls.title")}
        className="mkp-version-dialog"
        role="dialog"
      >
        <div className="mkp-version-dialog__header">
          <h2 className="mkp-version-dialog__title">{t("marketplace.versionControls.title")}</h2>
          <div className="mkp-version-dialog__actions">
            <button
              className="mkp-btn mkp-btn--primary"
              disabled={isBatchEnabling || selectedIdentifiers.length === 0}
              onClick={() => void onEnableSelected()}
              type="button"
            >
              {isBatchEnabling
                ? t("marketplace.selection.enabling")
                : selectedIdentifiers.length > 0
                  ? t("marketplace.selection.enableSelectedCount", {
                      count: selectedIdentifiers.length,
                    })
                  : t("marketplace.selection.enableSelected")}
            </button>
            <button className="mkp-btn mkp-btn--ghost" onClick={onClose} type="button">
              {t("marketplace.actions.close")}
            </button>
          </div>
        </div>

        {selectedIdentifiers.length === 0 && (
          <div className="mkp-state" role="status">
            {t("marketplace.versionControls.noneSelectedBody")}
          </div>
        )}

        <div className="mkp-version-dialog__content">
          {selectedIdentifiers.map((identifier) => (
            <ModuleSection
              identifier={identifier}
              isActionPending={isActionPending}
              itemsByIdentifier={itemsByIdentifier}
              key={identifier}
              onRunAction={onRunAction}
              onSelectVersion={onSelectVersion}
              path={[]}
              selectedByIdentifier={selectedByIdentifier}
            />
          ))}
        </div>
      </div>
    </Dialog>
  );
};

interface ModuleSectionProps {
  identifier: string;
  versionRange?: string;
  itemsByIdentifier: Record<string, MarketplaceCatalogItem>;
  selectedByIdentifier: Record<string, MarketplaceCatalogItem>;
  onRunAction: (item: MarketplaceCatalogItem, actionKind: MarketplaceActionKind) => void;
  onSelectVersion: (item: MarketplaceCatalogItem, version: string) => void;
  isActionPending: (item: MarketplaceCatalogItem) => boolean;
  path: string[];
}

const ModuleSection = ({
  identifier,
  versionRange,
  itemsByIdentifier,
  selectedByIdentifier,
  onRunAction,
  onSelectVersion,
  isActionPending,
  path,
}: ModuleSectionProps) => {
  const baseItem = itemsByIdentifier[identifier];
  const selectedItem = selectedByIdentifier[identifier] ?? baseItem;
  const [isExpanded, setExpanded] = React.useState(path.length < 1);
  const [, rerender] = React.useReducer((count) => count + 1, 0);
  const activeVersion = selectedItem?.version;

  const range = React.useMemo(() => {
    if (!versionRange) {
      return null;
    }

    try {
      return parseRange(versionRange);
    } catch {
      return null;
    }
  }, [versionRange]);

  React.useEffect(() => {
    if (!isExpanded || !baseItem) {
      return;
    }

    let isDisposed = false;

    const hydrateMetadata = async () => {
      const pending = baseItem.instances
        .filter((instance) => !instance.metadata)
        .map((instance) =>
          instance.ensureMetadata().catch(() => {
            return null;
          }),
        );

      if (!pending.length) {
        return;
      }

      await Promise.allSettled(pending);
      if (!isDisposed) {
        rerender();
      }
    };

    void hydrateMetadata();

    return () => {
      isDisposed = true;
    };
  }, [baseItem, isExpanded]);

  const versionItems = React.useMemo(() => {
    if (!baseItem) {
      return [];
    }

    return baseItem.instances
      .filter((instance) => {
        if (!range) {
          return true;
        }

        try {
          return satisfies(parse(instance.getVersion()), range);
        } catch {
          return false;
        }
      })
      .sort((left, right) => compareVersionsDesc(left.getVersion(), right.getVersion()))
      .map((instance) => createVersionItem(baseItem, instance));
  }, [baseItem, range]);

  if (!baseItem) {
    return (
      <div className="mkp-version-section mkp-version-section--missing">
        <div className="mkp-version-section__title">{identifier}</div>
        <p>{t("marketplace.versionControls.moduleNotFound")}</p>
      </div>
    );
  }

  return (
    <section className="mkp-version-section">
      <header className="mkp-version-section__header">
        <button
          className="mkp-version-section__toggle"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? "-" : "+"}
        </button>
        <div className="mkp-version-section__title-wrap">
          <h3 className="mkp-version-section__title">{baseItem.metadata?.name ?? identifier}</h3>
          <p className="mkp-version-section__meta">
            {identifier}
            {versionRange ? ` | ${t("marketplace.versionControls.range")}: ${versionRange}` : ""}
            {activeVersion
              ? ` | ${t("marketplace.versionControls.selectedVersion")}: ${activeVersion}`
              : ""}
          </p>
        </div>
      </header>

      {isExpanded && (
        <div className="mkp-version-section__body">
          {versionItems.map((versionItem) => (
            <VersionRow
              isActionPending={isActionPending(versionItem)}
              isCurrent={versionItem.version === activeVersion}
              item={versionItem}
              key={`${identifier}@${versionItem.version}`}
              onRunAction={onRunAction}
              onSelectVersion={onSelectVersion}
            />
          ))}

          {versionItems
            .filter((item) => !!item.instance.metadata)
            .map((item) => {
              const dependencies = item.instance.metadata?.dependencies ?? {};
              const dependencyEntries = Object.entries(dependencies);
              if (!dependencyEntries.length) {
                return null;
              }

              return (
                <div className="mkp-version-deps" key={`deps-${identifier}@${item.version}`}>
                  <p className="mkp-version-deps__title">
                    {t("marketplace.versionControls.dependenciesFor", {
                      version: item.version,
                    })}
                  </p>

                  {dependencyEntries.map(([dependencyIdentifier, dependencyRange]) => {
                    if (path.includes(dependencyIdentifier)) {
                      return (
                        <div
                          className="mkp-version-cycle"
                          key={`${identifier}-${dependencyIdentifier}`}
                        >
                          {t("marketplace.versionControls.cycleSkipped", {
                            module: dependencyIdentifier,
                          })}
                        </div>
                      );
                    }

                    return (
                      <ModuleSection
                        identifier={dependencyIdentifier}
                        isActionPending={isActionPending}
                        itemsByIdentifier={itemsByIdentifier}
                        key={`${identifier}-${item.version}-${dependencyIdentifier}`}
                        onRunAction={onRunAction}
                        onSelectVersion={onSelectVersion}
                        path={[...path, identifier]}
                        selectedByIdentifier={selectedByIdentifier}
                        versionRange={dependencyRange}
                      />
                    );
                  })}
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
};

interface VersionRowProps {
  item: MarketplaceCatalogItem;
  isCurrent: boolean;
  isActionPending: boolean;
  onRunAction: (item: MarketplaceCatalogItem, actionKind: MarketplaceActionKind) => void;
  onSelectVersion: (item: MarketplaceCatalogItem, version: string) => void;
}

const VersionRow = ({
  item,
  isCurrent,
  isActionPending,
  onRunAction,
  onSelectVersion,
}: VersionRowProps) => {
  const { instance } = item;
  const canRunLoadToggle = instance.isLoaded() ? instance.canUnload() : instance.canLoad();

  return (
    <div className={`mkp-version-row${isCurrent ? " mkp-version-row--active" : ""}`}>
      <div className="mkp-version-row__left">
        <span className="mkp-version-row__version">{instance.getVersion()}</span>
        <span className="mkp-version-row__status">
          {instance.isInstalled()
            ? t("marketplace.card.status.installed")
            : t("marketplace.card.status.notInstalled")}
          {" | "}
          {instance.isEnabled()
            ? t("marketplace.card.status.enabled")
            : t("marketplace.card.status.disabled")}
          {" | "}
          {instance.isLoaded()
            ? t("marketplace.card.status.loaded")
            : t("marketplace.card.status.unloaded")}
        </span>
      </div>

      <div className="mkp-version-row__actions">
        <button
          className="mkp-btn mkp-btn--ghost"
          disabled={isActionPending || isCurrent}
          onClick={() => onSelectVersion(item, instance.getVersion())}
          type="button"
        >
          {t("marketplace.actions.use")}
        </button>

        {instance.canAdd() && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isActionPending}
            onClick={() => onRunAction(item, "add")}
            type="button"
          >
            {t("marketplace.actions.add")}
          </button>
        )}

        {instance.canInstallRemove() && !instance.isInstalled() && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isActionPending}
            onClick={() => onRunAction(item, "install")}
            type="button"
          >
            {t("marketplace.actions.install")}
          </button>
        )}

        {instance.isInstalled() && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isActionPending}
            onClick={() => onRunAction(item, instance.isEnabled() ? "disable" : "enable")}
            type="button"
          >
            {instance.isEnabled()
              ? t("marketplace.actions.disable")
              : t("marketplace.actions.enable")}
          </button>
        )}

        {instance.isInstalled() && instance.isEnabled() && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isActionPending || !canRunLoadToggle}
            onClick={() => onRunAction(item, instance.isLoaded() ? "unload" : "load")}
            type="button"
          >
            {instance.isLoaded() ? t("marketplace.actions.unload") : t("marketplace.actions.load")}
          </button>
        )}

        {instance.canInstallRemove() && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isActionPending}
            onClick={() => onRunAction(item, "remove")}
            type="button"
          >
            {t("marketplace.actions.remove")}
          </button>
        )}

        {instance.canDelete() && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isActionPending}
            onClick={() => onRunAction(item, "delete")}
            type="button"
          >
            {t("marketplace.actions.delete")}
          </button>
        )}
      </div>
    </div>
  );
};

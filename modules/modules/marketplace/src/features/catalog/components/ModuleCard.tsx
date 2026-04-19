import { display } from "/modules/stdlib/lib/modal.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { Cards } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { t } from "../../../shared/i18n.ts";
import { RemoteMarkdown } from "../../module/components/RemoteMarkdown.tsx";
import type {
  MarketplaceActionDescriptor,
  MarketplaceActionKind,
  MarketplaceCatalogItem,
} from "../types.ts";

interface ModuleCardProps {
  item: MarketplaceCatalogItem;
  isPending: boolean;
  isSelected: boolean;
  primaryAction: MarketplaceActionDescriptor;
  runtimeAction: MarketplaceActionDescriptor | null;
  secondaryAction: MarketplaceActionDescriptor | null;
  onCardSelectGesture: (item: MarketplaceCatalogItem, event: React.MouseEvent<HTMLElement>) => void;
  onOpenDetails: (item: MarketplaceCatalogItem) => void;
  onRunAction: (item: MarketplaceCatalogItem, actionKind: MarketplaceActionKind) => void;
  onSelectVersion: (item: MarketplaceCatalogItem, version: string) => void;
  onToggleSelected: (item: MarketplaceCatalogItem, event?: React.MouseEvent<HTMLElement>) => void;
}

const statusLabels = (item: MarketplaceCatalogItem): string[] => {
  return [
    item.instance.isLocal()
      ? t("marketplace.card.status.local")
      : t("marketplace.card.status.remote"),
    item.instance.isInstalled()
      ? t("marketplace.card.status.installed")
      : t("marketplace.card.status.notInstalled"),
    item.instance.isEnabled()
      ? t("marketplace.card.status.enabled")
      : t("marketplace.card.status.disabled"),
    item.instance.isLoaded()
      ? t("marketplace.card.status.loaded")
      : t("marketplace.card.status.unloaded"),
  ];
};

const MAX_TAGS = 4;

const resolveAssetUrl = (assetPath: string | undefined, metadataUrl: string | null) => {
  if (!assetPath) {
    return null;
  }

  if (
    assetPath.startsWith("/") ||
    assetPath.startsWith("http://") ||
    assetPath.startsWith("https://") ||
    assetPath.startsWith("data:")
  ) {
    return assetPath;
  }

  if (metadataUrl && assetPath.startsWith("./")) {
    return `${metadataUrl}/../${assetPath}`;
  }

  return null;
};

const fallbackImage = () => (
  <svg
    aria-hidden="true"
    data-testid="card-image-fallback"
    role="img"
    style={{ height: "64px", width: "64px" }}
    viewBox="0 0 24 24"
  >
    <path
      d="M20.929,1.628A1,1,0,0,0,20,1H4a1,1,0,0,0-.929.628l-2,5A1.012,1.012,0,0,0,1,7V22a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V7a1.012,1.012,0,0,0-.071-.372ZM4.677,3H19.323l1.2,3H3.477ZM3,21V8H21V21Zm8-3a1,1,0,0,1-1,1H6a1,1,0,0,1,0-2h4A1,1,0,0,1,11,18Z"
      fill="currentColor"
    />
  </svg>
);

export const ModuleCard = ({
  item,
  isPending,
  isSelected,
  primaryAction,
  runtimeAction,
  secondaryAction,
  onCardSelectGesture,
  onOpenDetails,
  onRunAction,
  onSelectVersion,
  onToggleSelected,
}: ModuleCardProps) => {
  const metadata = item.metadata;
  const name = metadata?.name ?? item.identifier;
  const description = metadata?.description ?? t("marketplace.state.noDescription");
  const metadataUrl = item.instance.getMetadataURL();
  const previewUrl = resolveAssetUrl(metadata?.preview, metadataUrl);
  const readmeUrl = resolveAssetUrl(metadata?.readme, metadataUrl);
  const authors = metadata?.authors ?? [];
  const importantTags = metadata?.hasMixins ? ["mixins"] : [];
  const tags = (metadata?.tags ?? []).filter(
    (tag) => !["theme", "app", "extension", "snippet", "lib"].includes(tag),
  );
  const [isTagsExpanded, setIsTagsExpanded] = React.useState(false);
  const hasDetails = !!item.instance.getRemoteArtifactURL();
  const externalHref = item.instance.getRemoteArtifactURL();

  const allTags = [...importantTags, ...tags];
  const visibleTags = isTagsExpanded ? allTags : allTags.slice(0, MAX_TAGS);
  const hasHiddenTags = allTags.length > MAX_TAGS;

  const onCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,a,input,select,label")) {
      return;
    }

    onCardSelectGesture(item, event);
  };

  const onPreviewClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!readmeUrl) {
      return;
    }

    display({
      title: name,
      content: <RemoteMarkdown url={readmeUrl} />,
      isLarge: true,
    });
  };

  return (
    <article className={`mkp-card${isSelected ? " mkp-card--selected" : ""}`} onClick={onCardClick}>
      <button className="mkp-card__preview" onClick={onPreviewClick} type="button">
        <Cards.CardImage
          FallbackComponent={fallbackImage}
          images={previewUrl ? [{ url: previewUrl }] : []}
          key={previewUrl}
        />
      </button>

      <header className="mkp-card__header">
        <div className="mkp-card__titles">
          {externalHref ? (
            <a
              className="mkp-card__title-link"
              href={externalHref}
              onClick={(event) => event.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              <h3 className="mkp-card__title">{name}</h3>
            </a>
          ) : (
            <h3 className="mkp-card__title">{name}</h3>
          )}
          <p className="mkp-card__identifier">{item.identifier}</p>

          {authors.length > 0 && (
            <div className="mkp-card__authors">
              {authors.map((author) => (
                <a
                  className="mkp-card__author"
                  href={`https://github.com/${author}`}
                  key={author}
                  onClick={(event) => event.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {author}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mkp-card__header-right">
          {item.instances.length > 1 ? (
            <label className="mkp-card__version-picker">
              <span>{t("marketplace.card.version")}</span>
              <select
                onChange={(event) => onSelectVersion(item, event.currentTarget.value)}
                value={item.version}
              >
                {item.instances.map((instance) => (
                  <option key={instance.getVersion()} value={instance.getVersion()}>
                    {instance.getVersion()}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="mkp-card__version">v{item.version}</span>
          )}

          <label className="mkp-card__select-toggle">
            <input checked={isSelected} onChange={() => onToggleSelected(item)} type="checkbox" />
            <span>{t("marketplace.card.select")}</span>
          </label>
        </div>
      </header>

      <p className="mkp-card__description">{description}</p>

      <div className="mkp-card__status-row">
        {statusLabels(item).map((status) => (
          <span className="mkp-card__status" key={status}>
            {status}
          </span>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="mkp-card__tags">
          {visibleTags.map((tag) => (
            <span className="mkp-card__tag" key={tag}>
              {tag}
            </span>
          ))}
          {!isTagsExpanded && hasHiddenTags && (
            <button
              className="mkp-card__tag-toggle"
              onClick={(event) => {
                event.stopPropagation();
                setIsTagsExpanded(true);
              }}
              type="button"
            >
              ...
            </button>
          )}
        </div>
      )}

      <div className="mkp-card__actions">
        <button
          className="mkp-btn mkp-btn--ghost"
          disabled={!hasDetails}
          onClick={() => onOpenDetails(item)}
          type="button"
        >
          {t("marketplace.card.details")}
        </button>

        {runtimeAction && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isPending || !!runtimeAction.disabled}
            onClick={() => onRunAction(item, runtimeAction.kind)}
            type="button"
          >
            {runtimeAction.label}
          </button>
        )}

        <button
          className="mkp-btn mkp-btn--primary"
          disabled={isPending || !!primaryAction.disabled}
          onClick={() => onRunAction(item, primaryAction.kind)}
          type="button"
        >
          {isPending ? t("marketplace.state.working") : primaryAction.label}
        </button>

        {secondaryAction && (
          <button
            className="mkp-btn mkp-btn--ghost"
            disabled={isPending || !!secondaryAction.disabled}
            onClick={() => onRunAction(item, secondaryAction.kind)}
            type="button"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </article>
  );
};

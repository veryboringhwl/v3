import { toPascalCase } from "/hooks/std/text.ts";
import { findBy, fnStr } from "/hooks/util.ts";
import { webpackRequire } from "../wpunpk.mix.ts";
import { matchWebpackModule } from "../wpunpk.ts";

import { exportedFunctions, exportedMemoForwardRefs, exportedMemos, modules } from "./index.ts";

await globalThis.CHUNKS.xpui.promise;

export const Menus: any = Object.fromEntries(
  exportedMemos.flatMap((m) => {
    const str = fnStr(m.type) as string;
    const match = str.match(/value:"([\w-]+)"/);
    const name = match?.[1] ?? "";
    const type = {
      album: "Album",
      show: "PodcastShow",
      artist: "Artist",
      track: "Track",
    }[name];
    return type ? [[type, m]] : [];
  }),
);

const [playlistMenuModuleID] = modules.find(
  ([, v]) =>
    fnStr(v).includes("isRootlistable") &&
    fnStr(v).includes("canAdministratePermissions") &&
    fnStr(v).includes("isPublished"),
)!;
Menus.Playlist = Object.values(webpackRequire(playlistMenuModuleID)).find(
  (m) => typeof m === "function" || typeof m === "object",
);

export const Cards: any = Object.assign(
  {
    Generic: exportedFunctions.find(
      (f) =>
        fnStr(f).includes("OnMouseDown") &&
        fnStr(f).match(/^[^;]*headerText/) &&
        fnStr(f).match(/^[^;]*featureIdentifier/) &&
        fnStr(f).match(/^[^;]*renderCardImage/),
    ),
    HeroGeneric: findBy("herocard-click-handler")(exportedFunctions),
    CardImage: findBy('"card-image"')(exportedFunctions),
  },
  Object.fromEntries(
    [
      exportedFunctions.map((m) => {
        try {
          const str = fnStr(m);
          const match = str.match(/featureIdentifier:"(.+?)"/);
          if (!match) return [];
          const name = match[1];
          return [[toPascalCase(name), m]];
        } catch (_e) {
          return [];
        }
      }),
      exportedMemos.map((m) => {
        try {
          const str = fnStr((m as any).type);
          const match = str.match(/featureIdentifier:"(.+?)"/);
          if (!match) return [];
          const name = match[1];
          return [[toPascalCase(name), m]];
        } catch (_e) {
          return [];
        }
      }),
    ].flat(2),
  ),
);

const [NavigationModule] = modules.find(
  ([_, v]) => fnStr(v).includes("navigationalRoot") && fnStr(v).includes("noLink"),
);
export const Nav = Object.values(webpackRequire(NavigationModule))[0];

export const NavTo: React.FC<any> = exportedMemoForwardRefs.find((m) =>
  fnStr(m.type.render).includes("pageId"),
)!;

// 1. Set a default category (e.g., /tracks) when the user hits the root path.
// 2. Prevent a "back button loop" by replacing the history entry instead of adding a new one.
export let InstrumentedRedirect: React.FC<any>;
matchWebpackModule(
  (_id, module) => {
    const moduleStr = fnStr(module);
    return moduleStr.includes("interactionId??t.getInteractionId");
  },
  (id, _$) => {
    const module = webpackRequire(id);
    InstrumentedRedirect = Object.values(module)[0];
  },
);

const [ContextMenuModuleID] = modules.find(([_, v]) => fnStr(v).includes("toggleContextMenu"))!;
export const ContextMenu: any = Object.values(webpackRequire(ContextMenuModuleID))[0];

export const RightClickMenu: React.FC<any> = findBy(
  "action",
  "open",
  "trigger",
  "right-click",
)(exportedFunctions);

export const Tooltip: React.FC<any> = findBy("hover-or-focus", "tooltip")(exportedFunctions);

export const Menu: React.FC<any> = findBy("getInitialFocusElement", "children")(exportedFunctions);

export const MenuItem: React.FC<any> = findBy("handleMouseEnter", "onClick")(exportedFunctions);

export const MenuItemSubMenu: React.FC<any> = findBy("subMenuIcon")(exportedFunctions);

export const Snackbar = {
  wrapper: findBy("encore-light-theme", "elevated")(exportedFunctions),
  simpleLayout: findBy("leading", "center", "trailing")(exportedFunctions),
  ctaText: findBy("ctaText")(exportedFunctions),
  styledImage: findBy("placeholderSrc")(exportedFunctions),
};

export const FilterBox: React.NamedExoticComponent = exportedMemos.find((f) =>
  fnStr(f.type).includes("filterBoxApiRef"),
)!;

const [ScrollableContainerModule] = modules.find(
  ([_, v]) => fnStr(v).includes("scrollLeft") && fnStr(v).includes("showButtons"),
);
const ScrollableContainerExports = Object.values(webpackRequire(ScrollableContainerModule));
export const ScrollableContainer: React.FC<any> = ScrollableContainerExports.find(
  (m) => m && typeof m === "object" && Object.hasOwn(m, "$$typeof"),
);

const [ConfirmDialogModule] = modules.find(([_, v]) =>
  fnStr(v).includes("confirm-dialog-description"),
);
const ConfirmDialogExports = Object.values(webpackRequire(ConfirmDialogModule));
export const ConfirmDialog: React.FC<any> = ConfirmDialogExports.find(
  (m) => m && typeof m === "object" && Object.hasOwn(m, "$$typeof"),
);

export const Router: React.FC<any> = findBy("navigationType", "static")(exportedFunctions);

export const Routes: React.FC<any> = findBy(
  /\([a-zA-Z_$][\w$]*\)\{let\{children:[a-zA-Z_$][\w$]*,location:[a-zA-Z_$][\w$]*\}=[a-zA-Z_$][\w$]*/,
)(exportedFunctions);

export const Route: React.FC<any> = findBy(
  /^function [a-zA-Z_$][\w$]*\([a-zA-Z_$][\w$]*\)\{\(0,[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\)\(!1\)\}$/,
)(exportedFunctions);

export const GenericModal: React.FC<any> = findBy(
  "isOpen",
  "contentLabel",
  "animated",
)(exportedFunctions);

export const Dialog: React.FC<any> = findBy("isOpen", "unmountWhenClose")(exportedFunctions);

export const Tracklist: React.FC<any> = exportedMemos.find((f) =>
  fnStr(f.type).includes("nrValidItems"),
)!;

export const IconWrapper: React.FC<any> = findBy("button__icon-wrapper")(exportedFunctions);

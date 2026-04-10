import type * as ReactComponents_desktop_ts from "./ReactComponents.desktop.ts";
export let Settings: typeof ReactComponents_desktop_ts.Settings;
import("./ReactComponents.desktop.ts").then((m) => {
  Settings = m.Settings;
});

import type * as ReactComponents_panel_ts from "./ReactComponents.panel.ts";
export let PanelContainer: typeof ReactComponents_panel_ts.PanelContainer;
export let PanelContent: typeof ReactComponents_panel_ts.PanelContent;
export let PanelHeader: typeof ReactComponents_panel_ts.PanelHeader;
import("./ReactComponents.panel.ts").then((m) => {
  PanelContainer = m.PanelContainer;
  PanelContent = m.PanelContent;
  PanelHeader = m.PanelHeader;
});

import type * as ReactComponents_providers_tsx from "./ReactComponents.providers.tsx";
export let RemoteConfigProviderComponent: typeof ReactComponents_providers_tsx.RemoteConfigProviderComponent;
export let RemoteConfigProvider: typeof ReactComponents_providers_tsx.RemoteConfigProvider;
export let SnackbarProvider: typeof ReactComponents_providers_tsx.SnackbarProvider;
export let StoreProvider: typeof ReactComponents_providers_tsx.StoreProvider;
export let TracklistColumnsContextProvider: typeof ReactComponents_providers_tsx.TracklistColumnsContextProvider;
import("./ReactComponents.providers.tsx").then((m) => {
  RemoteConfigProviderComponent = m.RemoteConfigProviderComponent;
  RemoteConfigProvider = m.RemoteConfigProvider;
  SnackbarProvider = m.SnackbarProvider;
  StoreProvider = m.StoreProvider;
  TracklistColumnsContextProvider = m.TracklistColumnsContextProvider;
});

import type * as ReactComponents_xpui_ts from "./ReactComponents.xpui.ts";
export let Menus: typeof ReactComponents_xpui_ts.Menus;
export let Cards: typeof ReactComponents_xpui_ts.Cards;
export let Nav: typeof ReactComponents_xpui_ts.Nav;
export let NavTo: typeof ReactComponents_xpui_ts.NavTo;
export let InstrumentedRedirect: typeof ReactComponents_xpui_ts.InstrumentedRedirect;
export let ContextMenu: typeof ReactComponents_xpui_ts.ContextMenu;
export let RightClickMenu: typeof ReactComponents_xpui_ts.RightClickMenu;
export let Tooltip: typeof ReactComponents_xpui_ts.Tooltip;
export let Menu: typeof ReactComponents_xpui_ts.Menu;
export let MenuItem: typeof ReactComponents_xpui_ts.MenuItem;
export let MenuItemSubMenu: typeof ReactComponents_xpui_ts.MenuItemSubMenu;
export let Snackbar: typeof ReactComponents_xpui_ts.Snackbar;
export let FilterBox: typeof ReactComponents_xpui_ts.FilterBox;
export let ScrollableContainer: typeof ReactComponents_xpui_ts.ScrollableContainer;
export let ConfirmDialog: typeof ReactComponents_xpui_ts.ConfirmDialog;
export let Router: typeof ReactComponents_xpui_ts.Router;
export let Routes: typeof ReactComponents_xpui_ts.Routes;
export let Route: typeof ReactComponents_xpui_ts.Route;
export let GenericModal: typeof ReactComponents_xpui_ts.GenericModal;
export let Dialog: typeof ReactComponents_xpui_ts.Dialog;
export let Tracklist: typeof ReactComponents_xpui_ts.Tracklist;
export let IconWrapper: typeof ReactComponents_xpui_ts.IconWrapper;
import("./ReactComponents.xpui.ts").then((m) => {
  Menus = m.Menus;
  Cards = m.Cards;
  Nav = m.Nav;
  NavTo = m.NavTo;
  InstrumentedRedirect = m.InstrumentedRedirect;
  ContextMenu = m.ContextMenu;
  RightClickMenu = m.RightClickMenu;
  Tooltip = m.Tooltip;
  Menu = m.Menu;
  MenuItem = m.MenuItem;
  MenuItemSubMenu = m.MenuItemSubMenu;
  Snackbar = m.Snackbar;
  FilterBox = m.FilterBox;
  ScrollableContainer = m.ScrollableContainer;
  ConfirmDialog = m.ConfirmDialog;
  Router = m.Router;
  Routes = m.Routes;
  Route = m.Route;
  GenericModal = m.GenericModal;
  Dialog = m.Dialog;
  Tracklist = m.Tracklist;
  IconWrapper = m.IconWrapper;
});

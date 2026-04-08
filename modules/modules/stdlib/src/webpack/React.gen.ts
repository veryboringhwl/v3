import type * as React_xpui_ts from "./React.xpui.ts";
export let React: typeof React_xpui_ts.React;
export let ReactJSX: typeof React_xpui_ts.ReactJSX;
export let ReactDOM: typeof React_xpui_ts.ReactDOM;
export let ReactDOMServer: typeof React_xpui_ts.ReactDOMServer;
import("./React.xpui.ts").then((m) => {
  React = m.React;
  ReactJSX = m.ReactJSX;
  ReactDOM = m.ReactDOM;
  ReactDOMServer = m.ReactDOMServer;
});

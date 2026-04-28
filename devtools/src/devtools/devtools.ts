let panelWindow = null;

chrome.devtools.panels.create("Mapped Elements", null, "src/panel/panel.html", (panel) => {
  panel.onShown.addListener((pw) => {
    console.log("Panel shown,", pw);
    panelWindow = pw;
  });

  panel.onSearch.addListener((action, queryString) => {
    if (panelWindow) {
      panelWindow.postMessage(
        {
          source: "devtools-command",
          action: action,
          query: queryString,
        },
        "*",
      );
    }
  });
});

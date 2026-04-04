import { fnStr } from "/hooks/util.ts";

import { exportedForwardRefs, exportedFunctions } from "./index.js";

await (CHUNKS["/dwp-panel-section.js"] ??= Promise.withResolvers()).promise;
export const PanelContainer: React.FC<any> = exportedFunctions.find((f) =>
  fnStr(f).includes('"Desktop_PanelContainer_Id"'),
);

export const PanelContent: React.FC<any> = exportedForwardRefs.find((f) =>
  fnStr(f.render).includes("fixedHeader"),
);

export const PanelHeader: React.FC<any> = exportedFunctions.find((m) =>
  fnStr(m).includes("PanelHeader_CloseButton"),
)!;

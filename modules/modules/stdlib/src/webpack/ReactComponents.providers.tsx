import { findBy } from "/hooks/util.ts";
import { Platform } from "../expose/Platform.ts";
import type { React } from "../expose/React.ts";
import { exportedFunctions } from "./index.ts";

await CHUNKS.xpui.promise;

export const RemoteConfigProviderComponent = findBy(
  "resolveSuspense",
  "configuration",
)(exportedFunctions);

export const RemoteConfigProvider = ({
  configuration = Platform.getRemoteConfiguration(),
  children,
}: {
  configuration?: ReturnType<typeof Platform.getRemoteConfiguration>;
  children?: React.ReactNode;
}) => (
  <RemoteConfigProviderComponent configuration={configuration}>
    {children}
  </RemoteConfigProviderComponent>
);

export const SnackbarProvider = findBy("enqueueSnackbar called with invalid argument")(
  exportedFunctions,
);

export const StoreProvider: React.FC<any> = findBy(
  "notifyNestedSubs",
  "serverState",
)(exportedFunctions);

export const TracklistColumnsContextProvider: React.FC<any> = findBy(
  "columns",
  "visibleColumns",
  "toggleVisible",
)(exportedFunctions);

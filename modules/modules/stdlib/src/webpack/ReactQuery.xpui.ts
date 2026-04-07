import type {
  notifyManager as notifyManagerT,
  QueryClientProvider as QueryClientProviderT,
  QueryClient as QueryClientT,
  useInfiniteQuery as useInfiniteQueryT,
  useMutation as useMutationT,
  useQueryClient as useQueryClientT,
  useQuery as useQueryT,
  useSuspenseQuery as useSuspenseQueryT,
} from "npm:@tanstack/react-query";
import { findBy, fnStr } from "/hooks/util.ts";
import { webpackRequire } from "../wpunpk.mix.ts";
import { exported, exportedFunctions, modules } from "./index.ts";

await CHUNKS.xpui.promise;

export const QueryClient: typeof QueryClientT = findBy("defaultMutationOptions")(exportedFunctions);
export const PersistQueryClientProvider = findBy("persistOptions")(exportedFunctions);
export const QueryClientProvider: typeof QueryClientProviderT =
  findBy("use QueryClientProvider")(exportedFunctions);
export const notifyManager: typeof notifyManagerT = exported.find((m) => m.setBatchNotifyFunction);
export const useMutation: typeof useMutationT = findBy("mutateAsync")(exportedFunctions);
export const useQuery: typeof useQueryT = findBy(
  /^function [a-zA-Z_$][\w$]*\(([a-zA-Z_$][\w$]*),([a-zA-Z_$][\w$]*)\)\{return\(0,[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\)\(\1,[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*,\2\)\}$/,
)(exportedFunctions);
export const useQueryClient: typeof useQueryClientT = findBy(
  "client",
  "Provider",
  "mount",
)(exportedFunctions);
export const useSuspenseQuery: typeof useSuspenseQueryT = findBy(
  "throwOnError",
  "suspense",
  "enabled",
  "placeholderData",
)(exportedFunctions);

const [infiniteQueryModuleID] = modules.find(
  ([_, v]) => fnStr(v).includes("fetchPreviousPage") && fnStr(v).includes("getOptimisticResult"),
)!;
export const useInfiniteQuery: typeof useInfiniteQueryT = Object.values(
  webpackRequire(infiniteQueryModuleID),
).find((m) => typeof m === "function");

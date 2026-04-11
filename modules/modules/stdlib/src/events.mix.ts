import { BehaviorSubject, Subject } from "../deps.ts";
import { addPostWebpackRequireHook } from "./wpunpk.mix.ts";

function createGlobalThisShadow() {
  const globalThisShadow = {} as typeof globalThis;

  Object.setPrototypeOf(globalThisShadow, globalThis);

  Object.defineProperty(globalThisShadow, "self", { value: globalThisShadow });
  Object.defineProperty(globalThisShadow, "globalThis", { value: globalThisShadow });
  Object.defineProperty(globalThisShadow, "window", { value: globalThisShadow });

  return globalThisShadow;
}

type CosmosRequest = { uri: string; method: string; body: string };

const CosmosRequestSubject = new Subject<CosmosRequest>();
export const UpdateTitlebarSubject = new BehaviorSubject<number>(-1);

addPostWebpackRequireHook(($) => {
  const globalThisShadow = ($.g = createGlobalThisShadow());

  const $sendCosmosRequest = globalThis.sendCosmosRequest;
  Object.defineProperty(globalThisShadow, "sendCosmosRequest", {
    value: ($: any) => {
      const request = JSON.parse($.request);

      CosmosRequestSubject.next(request);

      return $sendCosmosRequest($);
    },
  });
});

const controlMessageListener = (request: CosmosRequest) => {
  const { uri, method } = request;

  if (uri === "sp://messages/v1/container/control" && method === "POST") {
    const body = JSON.parse(request.body);
    const { type, height } = body;

    if (type === "update_titlebar") {
      UpdateTitlebarSubject.next(height);
    }
  }
};

CosmosRequestSubject.subscribe(controlMessageListener);

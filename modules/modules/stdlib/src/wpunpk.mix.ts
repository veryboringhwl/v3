export type WebpackRequire = {
  (id: keyof any): any;
  m: WebpackChunk[1];
  g: typeof globalThis;
};

export type WebpackModule = <This extends {}>(
  this: This,
  module: { id: keyof any; loaded: false; exports: This },
  exports: This,
  require: WebpackRequire,
) => void;
export type WebpackModules = Record<keyof any, WebpackModule>;
export type WebpackChunk = [Array<keyof any>, WebpackModules, (wpr: WebpackRequire) => void];

export let webpackRequire: WebpackRequire;

const queuedWebpackRequireHooks: ((wpr: WebpackRequire) => void)[] = [];
queuedWebpackRequireHooks.push = (...hooks: ((wpr: WebpackRequire) => void)[]) => {
  if (webpackRequire) {
    for (const hook of hooks) {
      hook(webpackRequire);
    }
    return queuedWebpackRequireHooks.length;
  }

  return Array.prototype.push.apply(queuedWebpackRequireHooks, hooks);
};

export const postWebpackRequireHooks = queuedWebpackRequireHooks;

const webpackRequireResolvers = Promise.withResolvers<WebpackRequire>();
export const webpackRequireReady = webpackRequireResolvers.promise;

function flushWebpackRequireHooks(wpr: WebpackRequire) {
  if (postWebpackRequireHooks.length === 0) {
    return;
  }

  const hooks = postWebpackRequireHooks.splice(0, postWebpackRequireHooks.length);
  for (const hook of hooks) {
    hook(wpr);
  }
}

function setWebpackRequire(wpr: WebpackRequire) {
  webpackRequire = wpr;
  globalThis.__webpack_require__ = wpr;
  webpackRequireResolvers.resolve(wpr);
  flushWebpackRequireHooks(wpr);
}

export function onWebpackRequireReady(hook: (wpr: WebpackRequire) => void) {
  if (webpackRequire) {
    hook(webpackRequire);
    return;
  }

  postWebpackRequireHooks.push(hook);
}

declare global {
  var __webpack_require__: WebpackRequire;
  var webpackChunkclient_web: WebpackChunk[];
}

const webpackChunkclient_web = [
  [
    [Symbol.for("spicetify.webpack.chunk.id")],
    {},
    ($: WebpackRequire) => {
      setWebpackRequire($);
    },
  ] as WebpackChunk,
];

if (globalThis.__webpack_require__) {
  setWebpackRequire(globalThis.__webpack_require__);
}

globalThis.webpackChunkclient_web = webpackChunkclient_web;

//

import { assertEquals } from "/hooks/std/assert.ts";

import { Subject } from "../deps.ts";

type ChunkModulesPair = [WebpackChunk, WebpackModules];
export const chunkLoadedSubjectPre = new Subject<WebpackChunk>();
export const moduleLoadedSubject = new Subject<[keyof any, WebpackModule]>();
export const chunkLoadedSubjectPost = new Subject<ChunkModulesPair>();

function trap(fn: (chunk: WebpackChunk) => void) {
  return (chunk: WebpackChunk) => {
    chunkLoadedSubjectPre.next(chunk);

    const webpackRequire_m = webpackRequire.m;

    const newModules: WebpackChunk[1] = {};

    webpackRequire.m = new Proxy(webpackRequire_m, {
      set(target, p, newValue, receiver) {
        const ok = Reflect.set(target, p, newValue, receiver);
        if (ok) {
          newModules[p] = newValue;
          moduleLoadedSubject.next([p, newValue]);
        }
        return ok;
      },
    });

    fn(chunk);

    webpackRequire.m = webpackRequire_m;

    chunkLoadedSubjectPost.next([chunk, newModules]);
  };
}

// @ts-expect-error
webpackChunkclient_web.forEach = (fn: (chunk: WebpackChunk) => void) => {
  const trappedFn = trap(fn);

  Array.prototype.forEach.call(webpackChunkclient_web, (chunk, index) => {
    if (index === 0) {
      assertEquals(chunk[0], [Symbol.for("spicetify.webpack.chunk.id")]);

      fn(chunk);

      return;
    }

    trappedFn(chunk);
  });
};

globalThis.webpackChunkclient_web = new Proxy(webpackChunkclient_web, {
  set(target, p, newValue, receiver) {
    if (p !== "push") {
      return Reflect.set(target, p, newValue, receiver);
    }

    const push = function () {
      const args = Array.prototype.slice.call(arguments);
      for (const chunk of args) {
        trap(newValue)(chunk);
      }
    };

    return Reflect.set(target, p, push, receiver);
  },
});

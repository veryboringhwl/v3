import type { createMachine as createMachineT } from "npm:xstate";
import { transformer } from "../../mixin.ts";
import { Registry } from "./registry.ts";

export type StateMachine = ReturnType<typeof createMachineT>;
export let Machine: StateMachine;

const registry = new (class extends Registry<React.ReactNode> {
  private static NodeNash = Symbol.for("NodeHash");

  getHash(value: React.ReactNode) {
    if (!this.has(value)) {
      return null;
    }
    // @ts-expect-error
    const hash = value[this.constructor.NodeNash];
    const state = `bespoke_${hash}`;
    const event = `bespoke_${hash}_button_click`;
    return { state, event };
  }

  override add(value: React.ReactNode, onEntry?: any, onExit?: any): this {
    const hash = crypto.randomUUID();
    // @ts-expect-error
    value[this.constructor.NodeNash] = hash;
    const state = `bespoke_${hash}`;
    const event = `bespoke_${hash}_button_click`;

    stateToNode.set(state, value);

    ON[event] = {
      target: state,
    };

    STATES[state] = {
      on: Object.setPrototypeOf(
        {
          [event]: {
            target: "disabled",
          },
        },
        ON,
      ),
    };

    if (onEntry) {
      const entry = `bespoke_${hash}_entry`;
      STATES[state].entry = [entry];
      ACTIONS[entry] = onEntry;
    }
    if (onExit) {
      const exit = `bespoke_${hash}_exit`;
      const states = Machine.config.states;
      if (states?.[state]) {
        states[state].exit = [exit];
      }
      ACTIONS[exit] = onExit;
    }

    return super.add(value);
  }

  override delete(item: React.ReactNode): boolean {
    // @ts-expect-error
    const hash = item[this.constructor.NodeNash];
    const state = `bespoke_${hash}`;
    const event = `bespoke_${hash}_button_click`;

    stateToNode.delete(state);

    delete ON[event];
    return super.delete(item);
  }
})();
export default registry;

const stateToNode = new Map<string, React.ReactNode>();

declare global {
  var __renderPanel: any;
}

globalThis.__renderPanel = (state: string) => {
  if (!state.startsWith("bespoke_")) {
    return null;
  }

  return stateToNode.get(state);
};

let ON: Record<string, any> = {};
const STATES: Record<string, any> = {};
const ACTIONS: Record<string, any> = {};

transformer(
  (emit) => (str) => {
    emit();
    // seems like the same?
    // usePanelStateMachine();
    str = str.replace(
      /(=\(0,[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\)\(\{id:"RightPanelState)/,
      "=__Machine$1",
    );

    Object.defineProperty(globalThis, "__Machine", {
      set: ($: StateMachine) => {
        Machine = $;

        queueMicrotask(() => {
          ON = {
            ...ON,
            ...Machine.config.states?.disabled.on,
            panel_close_click: [
              {
                target: "disabled",
              },
            ],
          };
          delete ON.playback_autoplay_context_changed;

          for (const [k, v] of Object.entries(Machine.config.states!)) {
            if (k === "puffin_activation") {
              continue;
            }
            v.on = new Proxy(v.on!, {
              get(target, p, _receiver) {
                // @ts-expect-error
                if (p.startsWith("bespoke_")) {
                  // @ts-expect-error
                  return ON[p];
                }
                // @ts-expect-error
                return target[p];
              },
            });
          }

          Object.setPrototypeOf(Machine.config.states!, STATES);
          //@ts-expect-error
          Machine._options.actions = ACTIONS;
        });
      },
      get: () => Machine,
    });

    str = str.replace(
      /((?=(?:(?!default:)[\s\S])*?\.Queue:)(?=(?:(?!default:)[\s\S])*?\.DevicePicker:)(?=(?:(?!default:)[\s\S])*?\.Disabled:)(?:case\s+[\w$]+\.[\w$]+\.\w+:\s*)+return\s*!0;\s*default:\s*)/,
      "$1return true;",
    );

    return str;
  },
  {
    glob: /^\/xpui-modules\.js/,
  },
);

transformer(
  (emit) => (str) => {
    str = str.replace(
      /("PanelSection"[\s\S]*?pageId[\s\S]*?children\s*:\s*\[\s*)(?=(?:(?!in:)[\s\S])*?in:\s*([a-zA-Z_$][\w$]*)\s*===)/,
      "$1__renderPanel($2),",
    );
    emit();

    return str;
  },
  {
    glob: /^\/dwp-panel-section\.js/,
  },
);

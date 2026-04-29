import { storage } from "../../load.tsx";

const HIDE_CORE_MODULES_KEY = "hideCoreModules";
const HIDE_CORE_MODULES_EVENT = "marketplace:hideCoreModulesChanged";

const parseBoolean = (raw: string | null, fallback: boolean) => {
  if (raw === null) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "boolean") {
      return parsed;
    }
  } catch {
    // Ignore malformed storage value and use fallback.
  }

  return fallback;
};

export const getHideCoreModules = () =>
  parseBoolean(storage?.getItem(HIDE_CORE_MODULES_KEY) ?? null, false);

export const setHideCoreModules = (value: boolean) => {
  storage?.setItem(HIDE_CORE_MODULES_KEY, JSON.stringify(value));
  globalThis.dispatchEvent(
    new CustomEvent<boolean>(HIDE_CORE_MODULES_EVENT, {
      detail: value,
    }),
  );
};

export const subscribeHideCoreModules = (listener: (value: boolean) => void) => {
  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<boolean>;
    if (typeof customEvent.detail === "boolean") {
      listener(customEvent.detail);
      return;
    }

    listener(getHideCoreModules());
  };

  globalThis.addEventListener(HIDE_CORE_MODULES_EVENT, handleChange);
  return () => globalThis.removeEventListener(HIDE_CORE_MODULES_EVENT, handleChange);
};

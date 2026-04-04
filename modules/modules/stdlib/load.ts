import { hotwired, type LoadContext } from "/hooks/module.ts";
import { startEventHandlers } from "./src/events.ts";

const cancelEventHandlers = startEventHandlers();

const { promise, signal } = await hotwired<LoadContext>(import.meta);

signal.addEventListener("abort", () => {
  cancelEventHandlers();
});

promise.resolve(() => {
  cancelEventHandlers();
});

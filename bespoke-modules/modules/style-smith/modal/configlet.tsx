import ConfigletEditor from "../slate/index.tsx";
import type { Configlet, ConfigletManager } from "../src/configlet.ts";

// import CodeHighlightingExample from "../slate/code-hightlighting.tsx";

interface ConfigletSlateDocumentProps {
  configlet: Configlet;
  configletManager: ConfigletManager;
}
export const ConfigletSlateDocument = ({
  configlet,
  configletManager,
}: ConfigletSlateDocumentProps) => {
  return <ConfigletEditor configlet={configlet} configletManager={configletManager} />;
};

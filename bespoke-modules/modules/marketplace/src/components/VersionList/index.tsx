import type { Module, ModuleIdentifier, ModuleInstance } from "/hooks/module.ts";
import { parse, parseRange, satisfies } from "/hooks/std/semver.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { classnames } from "/modules/stdlib/src/webpack/ClassNames.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { ScrollableText } from "/modules/stdlib/src/webpack/ReactComponents.js";
import {
  PanelContainer,
  PanelContent,
  PanelHeader,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { usePanelAPI } from "/modules/stdlib/src/webpack/ReactHooks.ts";
import { useQuery } from "/modules/stdlib/src/webpack/ReactQuery.ts";
import { useLocation } from "/modules/stdlib/src/webpack/ReactRouter.xpui.ts";
import { useManageModules } from "../../components/ModuleCard/index.tsx";
import {
  FaRegMinusSquare,
  FaRegPlusSquare,
  MdCircle,
  MdCloudDownload,
  MdDelete,
  MdDeleteForever,
  MdInstallDesktop,
  MdOutlineCircle,
} from "../../deps/icons.ts";
import { useUpdate } from "../../util/index.ts";
import { useModules } from "../ModulesProvider/index.tsx";

export default function () {
  const location = useLocation();
  const { panelSend } = usePanelAPI();
  if (location.pathname !== "/bespoke/marketplace") {
    panelSend("panel_close_click");
  }

  return (
    <PanelContainer label="Marketplace">
      <PanelContent>
        <VersionListPanelContent />
      </PanelContent>
    </PanelContainer>
  );
}

const VersionListPanelContent = React.memo(() => {
  const m = useModules();
  const selectedModules = m.selectedModules.map(
    (identifier) => [m.modules[identifier], undefined] as const,
  );

  if (!selectedModules.length) {
    return (
      <>
        <PanelHeader title="No module selected" />
        Select a module to view its versions.
      </>
    );
  }

  const { fastEnableWithDependencies } = useManageModules(m);

  return (
    <>
      <PanelHeader title="Marketplace Version Selector" />
      <div className="flex flex-col gap-2">
        <button
          className="cursor-pointer border-0 rounded inline-flex items-center justify-between bg-green-500 text-white px-2 py-2 h-8"
          onClick={async (e) => {
            e.stopPropagation();
            const selectedInstances = selectedModules.map(
              ([[module]]) => m.moduleToInstance[module.getIdentifier()]!,
            );
            await fastEnableWithDependencies(...selectedInstances);
          }}
        >
          <MdInstallDesktop className="w-4 h-4" title="Add, Install, and Enable" />
          Enable all selected
        </button>
        {/* // TODO: add onDragOver onDragLeave onDrop */}
        {selectedModules.map(([module, versionRange]) => {
          const moduleIdentifier = module[0].getIdentifier();
          return (
            <ModuleSection
              key={moduleIdentifier}
              module={module}
              modules={m.modules}
              selectedInstance={m.moduleToInstance[moduleIdentifier]!}
              selectInstance={m.selectInstance}
              updateModule={m.updateModule}
              updateModules={m.updateModules}
              versionRange={versionRange}
            />
          );
        })}
      </div>
    </>
  );
});

const useCollapsed = (initialCollapsed?: boolean) => {
  const [isCollapsed, setCollapsed] = React.useState(initialCollapsed ?? false);
  const toggleCollapsed = React.useCallback(() => setCollapsed((collapsed) => !collapsed), []);

  const Button = () => (
    <button
      className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center"
      onClick={toggleCollapsed}
    >
      {isCollapsed ? (
        <FaRegPlusSquare className="w-4 h-4 fill-green-500" />
      ) : (
        <FaRegMinusSquare className="w-4 h-4 fill-red-500" />
      )}
    </button>
  );

  const Collapsed = (children: () => React.ReactNode) => !isCollapsed && <>{children()}</>;

  return [Button, Collapsed] as const;
};

interface ModuleSectionProps {
  module: [Module];
  modules: Record<ModuleIdentifier, [Module]>;
  collapsed?: boolean;
  versionRange?: string;
  updateModules: () => void;
  updateModule: (module: Module) => void;
  selectedInstance: ModuleInstance;
  selectInstance: (moduleInstance: ModuleInstance) => void;
}
const ModuleSection = (props: ModuleSectionProps) => {
  const { selectedInstance, selectInstance, versionRange } = props;
  const [module] = props.module;

  const heritage = module.getHeritage().join("▶");

  const [Button, Collapsed] = useCollapsed(props.collapsed);

  // TODO: add onDragStart
  return (
    <div className="flex flex-col bg-[var(--background-tinted-base)] rounded-lg px-2 pt-2">
      <div className="flex items-center gap-2 justify-between mb-2">
        <UI.Text
          as="div"
          className="flex-1 min-w-0"
          semanticColor="textBase"
          variant="bodyMediumBold"
        >
          <div className="overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none" }}>
            {cutPrefix(heritage, "▶")}
          </div>
          {versionRange && <div className="text-xs text-gray-500">{versionRange}</div>}
        </UI.Text>
        {Button()}
      </div>
      {Collapsed(() => {
        const range = parseRange(versionRange ?? "");

        return (
          <div className="bg-[var(--background-tinted-base)] rounded-lg px-2 pt-2 mb-2">
            {Array.from(module.instances)
              .filter(([version]) => satisfies(parse(version), range))
              .map(([version, inst]) => (
                <ModuleVersion
                  isSelected={inst === selectedInstance}
                  key={version}
                  moduleInstance={inst}
                  modules={props.modules}
                  selectInstance={selectInstance}
                  updateModule={props.updateModule}
                  updateModules={props.updateModules}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
};

function cutPrefix(str: string, prefix: string) {
  if (str.startsWith(prefix)) {
    return str.slice(prefix.length);
  }
  return str;
}

interface ModuleVersionProps {
  moduleInstance: ModuleInstance;
  modules: Record<ModuleIdentifier, [Module]>;
  isSelected: boolean;
  selectInstance: (moduleInstance: ModuleInstance) => void;
  updateModule: (module: Module) => void;
  updateModules: () => void;
}

const ModuleVersion = (props: ModuleVersionProps) => {
  const { moduleInstance, updateModule, updateModules } = props;

  const [Button, Collapsed] = useCollapsed(true);

  return (
    <div>
      <div
        className={classnames(
          "flex items-center gap-2 justify-between group",
          "rounded-md -mx-2 mt-0 mb-2 p-2 hover:bg-[var(--background-tinted-highlight)]",
          props.isSelected && "!bg-white !bg-opacity-30",
        )}
        onClick={() => props.selectInstance(moduleInstance)}
      >
        <div className="flex items-center w-4">
          {moduleInstance.isInstalled() && (
            <EnabledDisabledRad moduleInstance={moduleInstance} updateModules={updateModules} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <ScrollableText>
            <span className="font-medium">{moduleInstance.getVersion()}</span>
          </ScrollableText>
        </div>
        {moduleInstance.canAdd() && (
          <AddButton moduleInstance={moduleInstance} updateModule={updateModule} />
        )}
        {moduleInstance.canInstallRemove() && (
          <>
            <InstallButton moduleInstance={moduleInstance} updateModule={updateModule} />
            <RemoveButton moduleInstance={moduleInstance} updateModule={updateModule} />
          </>
        )}
        {moduleInstance.canDelete() && (
          <DeleteButton moduleInstance={moduleInstance} updateModule={updateModule} />
        )}
        {Button()}
      </div>
      {Collapsed(() => (
        <ModuleVersionInfo {...props} />
      ))}
    </div>
  );
};

const ModuleVersionInfo = (
  props: { moduleInstance: ModuleInstance } & Omit<
    ModuleSectionProps,
    "module" | "selectedInstance"
  >,
) => {
  const metadata = props.moduleInstance.metadata;

  useQuery({
    queryKey: ["module-version-info", props.moduleInstance.getIdentifier()],
    queryFn: () => props.moduleInstance.ensureMetadata(),
    enabled: !metadata,
  });

  if (!metadata) {
    return;
  }

  return (
    <div className="pb-2">
      <div
        className="bg flex flex-col gap-2 justify-between"
        style={{ "--hue-rotate-parent": `var(--hue-rotate, 0deg)` } as React.CSSProperties}
      >
        {Object.entries(metadata.dependencies).map(([moduleIdentifier, versionRange]) => {
          const module = props.modules[moduleIdentifier];
          if (!module) {
            return;
          }

          return (
            <div
              className="bg-[var(--background-base)] rounded-lg"
              key={moduleIdentifier}
              style={
                {
                  "--hue-rotate": `calc(var(--hue-rotate-parent) + 60deg)`,
                } as React.CSSProperties
              }
            >
              <div
                className="rounded-lg"
                style={{ backdropFilter: "hue-rotate(var(--hue-rotate))" }}
              >
                <ModuleSection
                  {...props}
                  collapsed
                  module={module}
                  selectedInstance={null}
                  versionRange={versionRange}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AddButtonProps {
  moduleInstance: ModuleInstance;
  updateModule: (module: Module) => void;
}
const AddButton = (props: AddButtonProps) => (
  <button
    className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center"
    onClick={async () => {
      const localModuleInstance = await props.moduleInstance.add();
      if (localModuleInstance) {
        props.updateModule(localModuleInstance.getModule());
      }
    }}
  >
    <MdCloudDownload className="w-4 h-4 fill-green-500" title="Add" />
  </button>
);

interface InstallButtonProps {
  moduleInstance: ModuleInstance;
  updateModule: (module: Module) => void;
}
const InstallButton = (props: InstallButtonProps) => (
  <button
    className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center"
    onClick={async () => {
      if (await props.moduleInstance.install()) {
        props.updateModule(props.moduleInstance.getModule());
      }
    }}
  >
    <MdInstallDesktop className="w-4 h-4 fill-green-500" title="Install" />
  </button>
);

interface EnabledDisabledButtonProps {
  moduleInstance: ModuleInstance;
  updateModules: () => void;
  setEnabled: (enabled: boolean) => void;
  updateEnabled: () => void;
}

const DisabledButton = (props: EnabledDisabledButtonProps) => {
  return (
    <button
      className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center opacity-0 group-hover:opacity-100"
      onClick={async () => {
        props.setEnabled(true);
        const moduleInstance = props.moduleInstance;
        const module = moduleInstance.getModule();
        if (await module.enable(moduleInstance)) {
          props.updateModules();
          props.updateEnabled();
        }
      }}
    >
      <MdOutlineCircle className="w-4 h-4 fill-red-500" title="Disabled" />
    </button>
  );
};

const EnabledButton = (props: EnabledDisabledButtonProps) => {
  return (
    <button
      className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center"
      onClick={async () => {
        props.setEnabled(false);
        const moduleInstance = props.moduleInstance;
        const module = moduleInstance.getModule();
        if (await module.disable()) {
          props.updateModules();
          props.updateEnabled();
        }
      }}
    >
      <MdCircle className="w-4 h-4 fill-green-500" title="Enabled" />
    </button>
  );
};

interface DeleteButtonProps {
  moduleInstance: ModuleInstance;
  updateModule: (module: Module) => void;
}
const DeleteButton = (props: DeleteButtonProps) => (
  <button
    className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center"
    onClick={async () => {
      if (await props.moduleInstance.delete()) {
        props.updateModule(props.moduleInstance.getModule());
      }
    }}
  >
    <MdDelete className="w-4 h-4 fill-red-500" title="Delete" />
  </button>
);

interface RemoveButtonProps {
  moduleInstance: ModuleInstance;
  updateModule: (module: Module) => void;
}
const RemoveButton = (props: RemoveButtonProps) => (
  <button
    className="bg-transparent cursor-pointer border-0 rounded inline-flex items-center"
    onClick={async () => {
      if (await props.moduleInstance.remove()) {
        const module = props.moduleInstance.getModule();
        props.updateModule(module);
      }
    }}
  >
    <MdDeleteForever className="w-4 h-4 fill-red-500" title="Remove" />
  </button>
);

interface EnaDisRadioProps {
  moduleInstance: ModuleInstance;
  updateModules: () => void;
}
const EnabledDisabledRad = (props: EnaDisRadioProps) => {
  const getIsEnabled = () => props.moduleInstance.isEnabled();
  const [isEnabled, setEnabled, updateEnabled] = useUpdate(getIsEnabled);

  const enabledDisabledButtonProps = { ...props, setEnabled, updateEnabled };

  return isEnabled
    ? EnabledButton(enabledDisabledButtonProps)
    : DisabledButton(enabledDisabledButtonProps);
};

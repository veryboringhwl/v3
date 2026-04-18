import { createIconComponent } from "/modules/stdlib/lib/createIconComponent.tsx";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { classnames } from "/modules/stdlib/src/webpack/ClassNames.ts";
import {
  Menu,
  MenuItem,
  MenuItemSubMenu,
  RightClickMenu,
  Toggle,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";
import type { Configlet, ConfigletManager } from "../src/configlet.ts";
import type { Entity, EntityContext } from "../src/entity.ts";
import { Palette, PaletteManager } from "../src/palette.ts";
import { Schemer } from "../src/schemer.ts";
import { CHECK_ICON_PATH } from "../static.ts";
import { useSyncedState } from "./hooks.ts";

export const SchemerContextModuleMenuItem = <E extends Entity<any, any>>({
  entity,
  schemer,
  entities,
}: {
  entity: E;
  schemer: Schemer;
  entities: Map<string, E>;
}) => {
  if (entities.size === 0) {
    return;
  }

  return (
    <MenuItemSubMenu depth={1} displayText={schemer.getModuleIdentifier()} placement="right-start">
      {Object.entries(entities).map(([id, option]) => {
        const context = new Palette.Context(schemer.getModuleIdentifier(), id);
        const isSelected = entity.context && context.equals(entity.context);

        return (
          <SchemerContextIdMenuItem
            context={context}
            entity={option}
            isSelected={isSelected || false}
            key={id}
          />
        );
      })}
    </MenuItemSubMenu>
  );
};

export const SchemerContextIdMenuItem = ({
  entity,
  context,
  isSelected,
}: {
  entity: Entity<any, any>;
  context: EntityContext;
  isSelected: boolean;
}) => {
  const onClick = React.useCallback(() => {
    entity.context = context;
  }, [entity]);

  return (
    <MenuItem
      onClick={onClick}
      trailingIcon={isSelected && createIconComponent({ icon: CHECK_ICON_PATH })}
    >
      {entity.name}
    </MenuItem>
  );
};

export interface SchemerContextMenuProps {
  isSelected: boolean;
  isActive: boolean;
  entity: Palette | Configlet;
  selectEntity: (entity: Palette | Configlet) => void;
}
export const SchemerContextMenu = ({
  entity,
  isActive,
  isSelected,
  selectEntity,
}: SchemerContextMenuProps) => {
  const onSelect = React.useCallback(() => {
    selectEntity(entity);
  }, [entity]);

  const resetContext = React.useCallback(() => {
    entity.context = null;
  }, [entity]);

  const menu = (
    <Menu>
      <MenuItem disabled={entity.context == null} divider="after" onClick={resetContext}>
        Reset context
      </MenuItem>
      {Schemer.instances().map((schemer) => (
        <SchemerContextModuleMenuItem
          entities={schemer.getPalettes()}
          entity={entity}
          key={schemer.getModuleIdentifier()}
          schemer={schemer}
        />
      ))}
    </Menu>
  );

  return (
    <RightClickMenu menu={menu}>
      <MenuItem
        className={classnames(
          "mWj8N7D_OlsbDgtQx5GW",
          isSelected && "bg-[var(--background-tinted-highlight)]",
        )}
        onClick={onSelect}
        trailingIcon={isActive && createIconComponent({ icon: CHECK_ICON_PATH })}
      >
        {entity.name}
      </MenuItem>
    </RightClickMenu>
  );
};

export type InfoButtonProps = JSX.IntrinsicElements["button"];
export const InfoButton = (props: InfoButtonProps) => {
  const className = classnames(
    "info__button",
    "bg-white border-none h-8 rounded-[var(--border-radius)] px-3 text-black text-sm cursor-pointer",
    props.className,
  );
  return (
    <button {...props} className={className}>
      {props.children}
    </button>
  );
};

export interface EntityInfoProps<E extends typeof PaletteManager | typeof ConfigletManager> {
  entity: InstanceType<E["Entity"]>;
  entitiesUpdated: () => void;
  enitityManager: InstanceType<E>;
}
export const EntityInfo = <E extends typeof PaletteManager | typeof ConfigletManager>({
  entity,
  entitiesUpdated,
  enitityManager,
}: EntityInfoProps<E>) => {
  const [name, setName] = useSyncedState(entity.name);

  const deleteEntity = React.useCallback(() => {
    enitityManager.delete(entity);
    entitiesUpdated();
  }, [entity]);

  const resetEntity = React.useCallback(() => {
    entity.reset();
    enitityManager.save(entity);
    entitiesUpdated();
  }, [entity]);

  const renameEntity = React.useCallback(
    (name: string) => {
      enitityManager.rename(entity, name);
      entitiesUpdated();
    },
    [enitityManager, name, entity],
  );

  const toggleEntity = React.useCallback(() => {
    enitityManager.toggleActive(entity, enitityManager instanceof PaletteManager);
    entitiesUpdated();
  }, [enitityManager, entity]);

  // const copySerializedEntity = React.useCallback(async () => {
  // 	const serializedEntity = JSON.stringify(entity);
  // 	await Platform.getClipboardAPI().copy(serializedEntity);
  // }, [palette]);

  const copyEntity = React.useCallback(() => {
    const entityCtor = entity.constructor as E["Entity"];
    const copy = entityCtor.create(name, entity.data.copy(), entity.context);
    enitityManager.add(copy);
    entitiesUpdated();
  }, [name, entity.constructor, entity.data, entity.context]);

  return (
    <div className="palette__info flex gap-[var(--gap-primary)] text-sm">
      <input
        className="palette__name bg-[var(--input-bg)] p-2 border-none rounded-[var(--border-radius)] h-8 flex-grow text-base text-white"
        onChange={(e) => {
          const name = e.target.value;
          setName(name);
          renameEntity(name);
        }}
        placeholder="Custom Palette"
        value={name}
      />
      <Toggle onSelected={toggleEntity} value={enitityManager.isActive(entity)} />
      <InfoButton key="rename" onClick={resetEntity} type="button">
        Reset
      </InfoButton>
      <InfoButton key="delete" onClick={deleteEntity} type="button">
        Delete
      </InfoButton>
      <InfoButton onClick={copyEntity} type="button">
        Copy
      </InfoButton>
    </div>
  );
};

/* Copyright (C) 2024 harbassan, and Delusoire
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ChangeEvent } from "npm:@types/react";
import { startCase } from "/modules/stdlib/deps.ts";
import { useSearchBar } from "/modules/stdlib/lib/components/index.tsx";
import { createIconComponent } from "/modules/stdlib/lib/createIconComponent.tsx";
import { Platform } from "/modules/stdlib/src/expose/Platform.ts";
import { React } from "/modules/stdlib/src/expose/React.ts";
import { Color } from "/modules/stdlib/src/webpack/misc.ts";
import { MenuItem } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { Palette, PaletteManager } from "./palette.ts";

export default function () {
  const setCurrentPalette = (_: Palette, palette: Palette) =>
    PaletteManager.INSTANCE.setCurrent(palette);
  const getCurrentPalette = (_: undefined) => PaletteManager.INSTANCE.getCurrent();

  const [selectedPalette, selectPalette] = React.useReducer(
    setCurrentPalette,
    undefined,
    getCurrentPalette,
  );

  const getPalettes = () => PaletteManager.INSTANCE.getPalettes();

  const [palettes, updatePalettes] = React.useReducer(getPalettes, undefined, getPalettes);
  const [searchbar, search] = useSearchBar({
    placeholder: "Search Palettes",
    expanded: true,
  });

  function createPalette() {
    PaletteManager.INSTANCE.addUserPalette(
      new Palette(crypto.randomUUID(), "New Palette", selectedPalette.colors, false),
    );

    updatePalettes();
  }

  const filteredPalettes = palettes.filter((palette) =>
    palette.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="palette-modal-container">
      <div className="palette-list-container">
        <ul>
          {searchbar}
          <MenuItem
            divider="after"
            leadingIcon={createIconComponent({
              icon: '<path d="M14 7H9V2H7v5H2v2h5v5h2V9h5z"/><path fill="none" d="M0 0h16v16H0z"/>',
            })}
            onClick={createPalette}
          >
            Create New Palette
          </MenuItem>
          <ul className="palette-list">
            {filteredPalettes.map((palette) => (
              <MenuItem
                key={palette.id}
                onClick={() => selectPalette(palette)}
                trailingIcon={
                  palette === selectedPalette &&
                  createIconComponent({
                    icon: '<path d="M15.53 2.47a.75.75 0 0 1 0 1.06L4.907 14.153.47 9.716a.75.75 0 0 1 1.06-1.06l3.377 3.376L14.47 2.47a.75.75 0 0 1 1.06 0z"/>',
                  })
                }
              >
                {palette.name}
              </MenuItem>
            ))}
          </ul>
        </ul>
      </div>
      <PaletteFields palette={selectedPalette} updatePalettes={updatePalettes} />
    </div>
  );
}

interface PaletteFieldsProps {
  palette: Palette;
  updatePalettes: () => void;
}
const PaletteFields = (props: PaletteFieldsProps) => {
  return (
    <div className="palette-fields-container">
      <LocalInfo palette={props.palette} updatePalettes={props.updatePalettes} />
      <div className="palette-fields">
        {Object.entries(props.palette.colors).map(([name, value]) => (
          <PaletteField key={name} name={name} palette={props.palette} value={value} />
        ))}
      </div>
    </div>
  );
};

interface PaletteFieldProps {
  name: string;
  value: string;
  palette: Palette;
}
const PaletteField = (props: PaletteFieldProps) => {
  const updater = props.palette.colors[props.name].toCSS(Color.Format.HEX);
  const [value, setValue] = React.useState(updater);
  const _updateValue = useUpdater(setValue)(updater);

  const onChange = React.useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValue(value);

      let color: Color;
      try {
        color = Color.fromHex(value);
      } catch (_) {}
      if (!color) {
        return;
      }

      const colors = { ...props.palette.colors, [props.name]: color };

      if (props.palette.overwrite(colors)) {
        PaletteManager.INSTANCE.save();
      }

      if (PaletteManager.INSTANCE.isCurrent(props.palette)) {
        PaletteManager.INSTANCE.writeCurrent();
      }
    },
    [props.palette],
  );

  return (
    <div className="input-row">
      <label>{startCase(props.name)}</label>
      <input className="color-input" onChange={onChange} type="color" value={value} />
      <input className="text-input" onChange={onChange} type="text" value={value} />
    </div>
  );
};

interface LocalInfoProps {
  palette: Palette;
  updatePalettes: () => void;
}

const LocalInfo = (props: LocalInfoProps) => {
  const [name, setName] = React.useState(props.palette.name);
  const _updateName = useUpdater(setName)(props.palette.name);

  function deletePalette(palette: Palette) {
    PaletteManager.INSTANCE.deleteUserPalette(palette);
    props.updatePalettes();
  }

  function renamePalette(palette: Palette, name: string) {
    PaletteManager.INSTANCE.renameUserPalette(palette, name);
    props.updatePalettes();
  }

  return (
    <div className="palette-info">
      <input
        className="palette-name"
        onChange={(e) => setName(e.target.value)}
        placeholder="Custom Palette"
        readOnly={props.palette.isStatic}
        value={props.palette.isStatic ? `${name} (static)` : name}
      />
      {!props.palette.isStatic && [
        <button key="delete" onClick={() => deletePalette(props.palette)} type="button">
          Delete
        </button>,
        <button key="rename" onClick={() => renamePalette(props.palette, name)} type="button">
          Rename
        </button>,
      ]}
      <button
        onClick={() => {
          const css = JSON.stringify(props.palette);
          Platform.getClipboardAPI().copy(css);
        }}
        type="button"
      >
        Copy Object
      </button>
    </div>
  );
};

export const useUpdater =
  <S,>(dispatch: React.Dispatch<React.SetStateAction<S>>) =>
  (updater: React.SetStateAction<S>) => {
    const updateState = React.useCallback(() => dispatch(updater), [updater]);
    React.useEffect(updateState, [updateState]);
    return updateState;
  };

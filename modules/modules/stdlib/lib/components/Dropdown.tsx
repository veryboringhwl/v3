/* Copyright © 2024
 *      Delusoire <deluso7re@outlook.com>
 *
 * This file is part of bespoke/modules/stdlib.
 *
 * bespoke/modules/stdlib is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * bespoke/modules/stdlib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with bespoke/modules/stdlib. If not, see <https://www.gnu.org/licenses/>.
 */

import type { React } from "../../src/expose/React.ts";
import { UI } from "../../src/webpack/ComponentLibrary.ts";
import { ContextMenu, Menu, MenuItem } from "../../src/webpack/ReactComponents.ts";
import { createIconComponent } from "../createIconComponent.tsx";

const CheckIcon = () =>
  createIconComponent({
    // TODO
    icon: "" /*  SVGIcons.check */,
  });

interface MenuItemProps<O extends string> {
  option: O;
  isActive: boolean;
  onSwitch: (option: O) => void;
  children: React.ReactNode;
}
const DropdownMenuItem = <O extends string>({
  option,
  isActive,
  onSwitch,
  children,
}: MenuItemProps<O>) => {
  const activeStyle = {
    backgroundColor: "rgba(var(--spice-rgb-selected-row),.1)",
  };

  return (
    <MenuItem
      data-checked={isActive}
      onClick={() => onSwitch(option)}
      style={isActive ? activeStyle : undefined}
      trailingIcon={isActive ? <CheckIcon /> : undefined}
      trigger="click"
    >
      {children}
    </MenuItem>
  );
};

export interface OptionProps {
  preview?: boolean;
}
export type DropdownOptions = Record<string, React.FC<OptionProps>>;

interface DropdownMenuProps<O extends DropdownOptions> {
  options: O;
  activeOption: Extract<keyof NoInfer<O>, string>;
  onSwitch: (option: Extract<keyof NoInfer<O>, string>) => void;
}
export default function <O extends DropdownOptions>({
  options,
  activeOption,
  onSwitch,
}: DropdownMenuProps<O>) {
  const SelectedOption: React.FC<OptionProps> = options[activeOption];

  if (Object.keys(options).length === 1) {
    return (
      <button
        aria-expanded="false"
        className={MAP.sort_box.list.button}
        role="combobox"
        type="button"
      >
        <UI.Type semanticColor="textSubdued" variant="mesto">
          <SelectedOption preview />
        </UI.Type>
      </button>
    );
  }

  const DropdownMenu = (props: any) => {
    return (
      <Menu {...props}>
        {Object.entries(options).map(([option, Children]) => (
          <DropdownMenuItem
            isActive={option === activeOption}
            onSwitch={onSwitch}
            option={option as Extract<NoInfer<keyof O>, string>}
          >
            <Children />
          </DropdownMenuItem>
        ))}
      </Menu>
    );
  };

  return (
    <ContextMenu menu={<DropdownMenu />} trigger="click">
      <button
        aria-expanded="false"
        className={MAP.sort_box.list.button}
        role="combobox"
        type="button"
      >
        <UI.Type semanticColor="textSubdued" variant="mesto">
          <SelectedOption preview />
        </UI.Type>
        {createIconComponent({ icon: `<path d="m14 6-6 6-6-6h12z" />` })}
      </button>
    </ContextMenu>
  );
}

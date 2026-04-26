import { React } from "../../src/expose/React.ts";
import { UI } from "../../src/webpack/ComponentLibrary.ts";
import { ScrollableContainer } from "../../src/webpack/ReactComponents.ts";
import { type RFilterOpt, TreeNodeVal } from "./index.tsx";

export interface ChipFilterProps {
  availableFilters: RFilterOpt[];
  selectedFilters: RFilterOpt[];
  toggleFilter: (filter: RFilterOpt) => void;
  className?: string;
}
export const ChipFilter = React.memo(
  ({ availableFilters, selectedFilters, toggleFilter, className }: ChipFilterProps) => {
    const createChip = (isSelected: boolean) => (filter: RFilterOpt, index: number) => (
      <UI.Chip
        index={index}
        key={filter.key}
        onClick={() => toggleFilter(filter)}
        secondary={isSelected && index > 0}
        selected={isSelected}
        selectedColorSet="invertedLight"
        style={{ marginBlockEnd: 0, willChange: "transform, opacity" }}
        tabIndex={-1}
      >
        {filter.filter[TreeNodeVal]}
      </UI.Chip>
    );

    return (
      selectedFilters.length + availableFilters.length > 0 && (
        <ScrollableContainer ariaLabel={"Filter options"} className={className}>
          {selectedFilters.map(createChip(true))}
          {availableFilters.map(createChip(false))}
        </ScrollableContainer>
      )
    );
  },
);

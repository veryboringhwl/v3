import type { React } from "../../src/expose/React.ts";
import { UI } from "../../src/webpack/ComponentLibrary.xpui.ts";
import { NavTo } from "../../src/webpack/ReactComponents.xpui.ts";

interface NavToChipProps {
  to: string;
  title: string;
  selected: boolean;
  onClick?: () => void;
}

const NavToChip: React.FC<NavToChipProps> = (props) => (
  <NavTo
    replace={true}
    to={props.to}
    tabIndex={-1}
    onClick={props.onClick}
    className={MAP.search_chips.chip}
  >
    <UI.Chip selected={props.selected} selectedColorSet="invertedLight" tabIndex={-1}>
      {props.title}
    </UI.Chip>
  </NavTo>
);

export interface NavBarProps {
  namespace: string;
  categories: string[];
  selectedCategory: string;
}

const NavBar = ({ namespace, categories, selectedCategory }: NavBarProps) => (
  <div className={MAP.search_chips.wrapper_wrapper}>
    <div className={`${MAP.search_chips.wrapper} contentSpacing`}>
      <div className={MAP.search_chips.container}>
        {/*<ScrollableContainer>
					{categories.map((category) => (
						<NavToChip
							key={category}
							to={`spotify:app:bespoke:${namespace}:${category}`}
							title={category}
							selected={category === selectedCategory}
						/>
					))}
				</ScrollableContainer>*/}
        {categories.map((category) => (
          <NavToChip
            key={category}
            to={`spotify:app:bespoke:${namespace}:${category}`}
            title={category}
            selected={category === selectedCategory}
          />
        ))}
      </div>
    </div>
  </div>
);

export const TopNavBar = (props: NavBarProps) => (
  <div className="qHWqOt_TYlFxiF0Dm2fD" style={{ pointerEvents: "all" }}>
    <NavBar {...props} />
  </div>
);

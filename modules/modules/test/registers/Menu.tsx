import {
	MenuItem,
	MenuItemSubMenu,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";

export const TestMenu = () => {
	return (
		<MenuItemSubMenu
			depth={1}
			displayText="Stdlib diagnostics"
			placement="right-start"
		>
			<MenuItem
				divider="before"
				onClick={() => console.info("Nested MenuItem")}
			>
				Open diagnostics modal
			</MenuItem>
			<MenuItem onClick={() => console.info("MenuItem")}>
				Open /test from nav link
			</MenuItem>
		</MenuItemSubMenu>
	);
};

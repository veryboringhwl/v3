import { React } from "/modules/stdlib/src/expose/React.ts";
import {
	ContextMenu,
	FilterBox,
	Menu,
	MenuItem,
	MenuItemSubMenu,
	NavTo,
	PanelContainer,
	PanelContent,
	PanelHeader,
	Route,
	Routes,
	ScrollableContainer,
	ScrollableText,
	Toggle,
	Tooltip,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";

const NOOP = () => {};
const LONG_TEXT =
	"The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.";

const ProbeCard = ({
	title,
	render,
}: {
	title: string;
	render?: () => React.ReactNode;
}) => {
	return (
		<div
			style={{
				display: "grid",
				gap: "8px",
				background: "rgba(0,0,0,0.25)",
				borderRadius: "8px",
				padding: "10px",
			}}
		>
			<strong>{title}</strong>

			<div
				style={{
					border: "1px solid rgba(255,255,255,0.15)",
					borderRadius: "8px",
					padding: "8px",
					minHeight: "48px",
				}}
			>
				{render?.()}
			</div>
		</div>
	);
};

const Section = ({
	title,
	children,
}: {
	title: string;
	children?: React.ReactNode;
}) => (
	<div style={{ display: "grid", gap: "10px" }}>
		<h3 style={{ margin: 0 }}>{title}</h3>
		{children}
	</div>
);

export const TestPage = () => {
	return (
		<div
			style={{ padding: "24px", color: "white", display: "grid", gap: "16px" }}
		>
			<div
				style={{
					display: "grid",
					gap: "14px",
					maxHeight: "68vh",
					overflow: "auto",
				}}
			>
				<Section title="Menu">
					<ProbeCard
						title="<Menu />"
						render={() => (
							<Menu>
								<MenuItem onClick={NOOP}>Menu item</MenuItem>
								<MenuItemSubMenu
									depth={1}
									displayText="Sub menu"
									placement="right-start"
								>
									<MenuItem onClick={NOOP}>Nested item</MenuItem>
								</MenuItemSubMenu>
							</Menu>
						)}
					/>
				</Section>

				<Section title="Context Menu">
					<ProbeCard
						title="<ContextMenu />"
						render={() => (
							<ContextMenu
								trigger="right-click"
								placement="top"
								offset={[0, 8]}
								menu={
									<Menu>
										<MenuItem onClick={NOOP}>Context action</MenuItem>
									</Menu>
								}
							>
								<button type="button">Right click this target</button>
							</ContextMenu>
						)}
					/>
				</Section>

				<Section title="Tooltip">
					<ProbeCard
						title="<Tooltip />"
						render={() => (
							<Tooltip label="Tooltip probe">
								<button type="button">Hover for tooltip</button>
							</Tooltip>
						)}
					/>
				</Section>

				{/* <Section title="FilterBox">
					<ProbeCard
						title="<FilterBox />"
						render={() =>
							React.createElement(FilterBox as React.ElementType, {
								value: "",
								placeholder: "Type to filter",
								onChange: NOOP,
							})
						}
					/>
				</Section>

				<Section title="Toggle">
					<ProbeCard
						title="<Toggle />"
						render={() =>
							React.createElement(Toggle as React.ElementType, {
								id: "toggle-probe",
								value: false,
								onSelected: NOOP,
							})
						}
					/>
				</Section> */}

				{/* <Section title="ScrollableContainer">
					<ProbeCard
						title="<ScrollableContainer />"
						render={() => (
							<ScrollableContainer>
								<div style={{ display: "flex", gap: "8px", minWidth: "420px" }}>
									<button type="button">Item A</button>
									<button type="button">Item B</button>
									<button type="button">Item C</button>
								</div>
							</ScrollableContainer>
						)}
					/>
				</Section>
 */}
				{/* <Section title="ScrollableText">
					<ProbeCard
						title="<ScrollableText />"
						render={() => <ScrollableText>{LONG_TEXT}</ScrollableText>}
					/>
				</Section> */}

				<Section title="Routes and Route">
					<ProbeCard
						title="<Routes /><Route />"
						render={() => (
							<Routes>
								<Route path="/" element={<div>Route element rendered</div>} />
							</Routes>
						)}
					/>
				</Section>

				<Section title="NavTo">
					<ProbeCard
						title="<NavTo />"
						render={() =>
							React.createElement(
								NavTo as React.ElementType,
								{ to: "/home", replace: true },
								"Go to /home",
							)
						}
					/>
				</Section>

				{/* <Section title="Panel Components">
					<ProbeCard
						title="PanelContainer + PanelHeader + PanelContent"
						render={() =>
							React.createElement(
								PanelContainer as React.ElementType,
								null,
								React.createElement(PanelHeader as React.ElementType, {
									title: "Panel header",
								}),
								React.createElement(
									PanelContent as React.ElementType,
									null,
									React.createElement("div", null, "Panel content body"),
								),
							)
						}
					/>
				</Section> */}
			</div>
		</div>
	);
};

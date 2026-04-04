import { React } from "/modules/stdlib/src/expose/React.ts";
import {
	ContextMenu,
	Dialog,
	FilterBox,
	GenericModal,
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
	Settings,
	Toggle,
	Tooltip,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";

const NOOP = () => {};
const LONG_TEXT =
	"The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.";

type ProbeState = "rendered" | "failed";

class ProbeBoundary extends React.Component<{
	onError: (message: string) => void;
	children?: React.ReactNode;
}> {
	override componentDidCatch(error: Error) {
		this.props.onError(error?.message ?? String(error));
	}

	override render() {
		return this.props.children;
	}
}

const ProbeRendered = ({
	onRendered,
	children,
}: {
	onRendered: () => void;
	children?: React.ReactNode;
}) => {
	React.useEffect(() => {
		onRendered();
	}, [onRendered]);

	return <>{children}</>;
};

const ProbeCard = ({
	title,
	render,
}: {
	title: string;
	render?: () => React.ReactNode;
}) => {
	const [state, setState] = React.useState<ProbeState>("rendered");
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		setState("rendered");
		setError("");
	}, [title]);

	const onRendered = React.useCallback(() => {
		setState((value) => (value === "failed" ? value : "rendered"));
	}, []);

	const onError = React.useCallback((message: string) => {
		setState("failed");
		setError(message);
	}, []);

	const color = state === "rendered" ? "#8dff9d" : "#ff9898";

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
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "12px",
				}}
			>
				<strong>{title}</strong>
				<span style={{ color }}>{state}</span>
			</div>

			<div
				style={{
					border: "1px solid rgba(255,255,255,0.15)",
					borderRadius: "8px",
					padding: "8px",
					minHeight: "48px",
				}}
			>
				<ProbeBoundary onError={onError}>
					<ProbeRendered onRendered={onRendered}>{render?.()}</ProbeRendered>
				</ProbeBoundary>
			</div>

			{error && (
				<div
					style={{ color: "#ff9898", fontSize: "12px", whiteSpace: "pre-wrap" }}
				>
					{error}
				</div>
			)}
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
			<h2 style={{ margin: 0 }}>Stdlib Manual Component Playground</h2>

			<p style={{ margin: 0, opacity: 0.9 }}>
				Every section below is manually written, and each block mounts one
				specific component to verify it works inside Spotify.
			</p>

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

				<Section title="FilterBox">
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
				</Section>

				<Section title="ScrollableContainer">
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

				<Section title="ScrollableText">
					<ProbeCard
						title="<ScrollableText />"
						render={() => <ScrollableText>{LONG_TEXT}</ScrollableText>}
					/>
				</Section>

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

				<Section title="Panel Components">
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
				</Section>
			</div>
		</div>
	);
};

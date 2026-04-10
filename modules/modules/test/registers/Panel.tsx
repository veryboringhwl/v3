import {
	PanelContainer,
	PanelContent,
	PanelHeader,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";

export function TestPanel() {
	return (
		<PanelContainer label="TestPanel">
			<PanelContent>
				<PanelHeader title="This is Panel Header" />
				do stuff
			</PanelContent>
		</PanelContainer>
	);
}

import { TopbarRightButton } from "/modules/stdlib/src/registers/topbarRightButton.tsx";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";

const Icon = () => (
	<UI.Icon size="small" viewBox="0 0 24 24">
		<path
			d="M3 3h2l.5 3m0 0L7 15h11l3-9H5.5z"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
		/>
		<circle
			cx="8"
			cy="20"
			r="1"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
		/>
		<circle
			cx="17"
			cy="20"
			r="1"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
		/>
	</UI.Icon>
);

export const TestTopbarRightButton = () => (
	<TopbarRightButton
		icon={<Icon />}
		label="test-button"
		onClick={() => {
			console.log("Button clicked");
		}}
	/>
);

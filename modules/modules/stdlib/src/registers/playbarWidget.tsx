import { transformer } from "../../mixin.ts";
import { React } from "../expose/React.ts";
import { UI } from "../webpack/ComponentLibrary.ts";
import { Tooltip } from "../webpack/ReactComponents.ts";
import { Registry } from "./registry.ts";

const registry = new (class extends Registry<React.ReactNode> {
	override add(value: React.ReactNode): this {
		refresh?.();
		return super.add(value);
	}

	override delete(value: React.ReactNode): boolean {
		refresh?.();
		return super.delete(value);
	}
})();
export default registry;

let refresh: React.DispatchWithoutAction | undefined;

declare global {
	var __renderNowPlayingBarWidgets: any;
}

globalThis.__renderNowPlayingBarWidgets = () => [
	React.createElement(() => {
		[, refresh] = React.useReducer((n) => n + 1, 0);
		return <>{registry.all()}</>;
	}),
];

transformer(
	(emit) => (str) => {
		str = str.replace(
			/("hitRemoveLike".+?})\)\]/,
			"$1),...__renderNowPlayingBarWidgets()]",
		);

		emit();
		return str;
	},
	{
		glob: /^\/dwp-now-playing-bar\.js/,
	},
);

export type PlaybarWidgetProps = {
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
};
export const PlaybarWidget = ({ label, icon, onClick }: PlaybarWidgetProps) => {
	const IconComponent = React.useMemo(() => {
		return () => <>{icon}</>;
	}, [icon]);

	return (
		<Tooltip label={label}>
			<UI.ButtonTertiary
				aria-label={label}
				className={undefined}
				condensed={true}
				iconOnly={IconComponent}
				onClick={onClick}
				size="small"
			/>
		</Tooltip>
	);
};

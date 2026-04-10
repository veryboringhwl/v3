import { transformer } from "../../mixin.ts";
import { React } from "../expose/React.ts";
import { classnames } from "../webpack/ClassNames.ts";
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
	var __renderNowPlayingBarButtons: any;
}

globalThis.__renderNowPlayingBarButtons = () => [
	React.createElement(() => {
		[, refresh] = React.useReducer((n) => n + 1, 0);
		return <>{registry.all()}</>;
	}),
];

transformer(
	(emit) => (str) => {
		str = str.replace(
			/(desktop-npb-extra\.queueButton[\s\S]*?children:\s*\[)/,
			"$1...__renderNowPlayingBarButtons(),",
		);

		emit();
		return str;
	},
	{
		glob: /^\/dwp-now-playing-bar\.js/,
	},
);

export type PlaybarButtonProps = {
	label: string;
	isActive?: boolean;
	isActiveNoIndicator?: boolean;
	disabled?: boolean;
	icon?: React.ReactNode;
	onClick: () => void;
};
export const PlaybarButton = ({
	label,
	isActive = false,
	isActiveNoIndicator = false,
	disabled = false,
	icon,
	onClick,
}: PlaybarButtonProps) => {
	const IconComponent = React.useMemo(() => {
		return () => <>{icon}</>;
	}, [icon]);

	return (
		<Tooltip label={label}>
			<UI.ButtonTertiary
				aria-label={label}
				aria-pressed={isActive}
				className={classnames(MAP.main.playbar.buttons.button.wrapper, {
					[MAP.main.playbar.buttons.button.wrapper__indicator]: isActive,
					[MAP.main.playbar.buttons.button.wrapper__active]:
						isActive || isActiveNoIndicator,
				})}
				data-active={isActive.toString()}
				disabled={disabled}
				iconOnly={IconComponent}
				onClick={onClick}
				size="small"
			/>
		</Tooltip>
	);
};

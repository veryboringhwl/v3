import { PlaybarButton } from "/modules/stdlib/src/registers/playbarButton.tsx";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";

function Icon({ filled = false }: { filled?: boolean }) {
  return (
    <UI.Icon size="medium" viewBox="0 0 24 24">
      <path
        d="M3 3h2l.45 2.7m0 0L7 15h10.75l3.25-9.3H5.45z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="9" cy="19" fill="currentColor" r="1.35" />
      <circle cx="17" cy="19" fill="currentColor" r="1.35" />
    </UI.Icon>
  );
}

export const TestPlaybarButton = () => (
  <PlaybarButton
    icon={<Icon />}
    label="test-button"
    onClick={() => {
      console.log("test-button clicked");
    }}
  />
);

// export const TestPlaybarButton = () => {
// 	const { isActive, panelSend } = usePanelAPI(hash?.state);

// 	const handleButtonClick = () => {
// 		console.log(isActive, panelSend);
// 		if (hash) {
// 			panelSend(hash.event);
// 			console.log(hash);
// 		}
// 	};
// 	return (
// 		<PlaybarButton
// 			icon={<Icon />}
// 			isActive={isActive}
// 			label="test-button"
// 			onClick={handleButtonClick}
// 		/>
// 	);
// };

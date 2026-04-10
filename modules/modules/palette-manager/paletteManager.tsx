import { display } from "/modules/stdlib/lib/modal.tsx";
import { TopbarLeftButton } from "/modules/stdlib/src/registers/topbarLeftButton.tsx";
import Modal from "./modal.tsx";

const Icon = () => (
  <svg
    fill="currentcolor"
    height="24"
    version="1.0"
    viewBox="0 0 16 16"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.472.279L2.583 10.686l-.887 4.786 4.588-1.625L15.173 3.44 11.472.279zM5.698 12.995l-2.703.957.523-2.819v-.001l2.18 1.863zm-1.53-2.623l7.416-8.683 2.18 1.862-7.415 8.683-2.181-1.862z" />
  </svg>
);

export const EditButton = () => {
  return (
    <TopbarLeftButton
      data-testid="top-bar-palette-manager-button"
      icon={<Icon />}
      label="Palette Manager"
      onClick={() => {
        display({
          title: "Palette Manager",
          content: <Modal />,
          isLarge: true,
        });
      }}
    />
  );
};

import { React } from "/modules/stdlib/src/expose/React.ts";
import { TopbarLeftButton } from "/modules/stdlib/src/registers/topbarLeftButton.tsx";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { Dialog } from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { Modal } from "../modal/Modal.tsx";

const Icon = () => (
  <UI.Icon size="medium" viewBox="0 0 24 24">
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

export const TestTopbarLeftButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Dialog
        animated={true}
        isOpen={isOpen}
        onCancel={handleClose}
        onClose={handleClose}
        unmountWhenClose={false}
      >
        <Modal onClose={handleClose} />
      </Dialog>
      <TopbarLeftButton icon={<Icon />} label="Topbar Button" onClick={() => setIsOpen(true)} />
    </>
  );
};

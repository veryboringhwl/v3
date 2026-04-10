import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.xpui.ts";

export const Modal = ({ onClose }) => {
  return (
    <div
      className={MAP.modal.widget_generator.container}
      style={{ overflow: "scroll", width: "60vw" }}
    >
      <div className={MAP.modal.widget_generator.header.container}>
        <UI.Text as="h1" variant="titleSmall">
          {"Example Modal"}
        </UI.Text>
        <button className={MAP.modal.widget_generator.header.close} onClick={onClose}>
          <UI.Icon fill="currentcolor" height="16" viewBox="0 0 16 16" width="16">
            <path d="M2.47 2.47a.75.75 0 0 1 1.06 0L8 6.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L9.06 8l4.47 4.47a.75.75 0 1 1-1.06 1.06L8 9.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L6.94 8 2.47 3.53a.75.75 0 0 1 0-1.06Z" />{" "}
          </UI.Icon>
        </button>
      </div>
      <div className={MAP.modal.widget_generator.content.container}>{"The MENU STUFF"}</div>
    </div>
  );
};

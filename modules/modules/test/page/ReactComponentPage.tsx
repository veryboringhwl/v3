import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  Cards,
  ConfirmDialog,
  ContextMenu,
  Dialog,
  GenericModal,
  Menu,
  MenuItem,
  MenuItemSubMenu,
  NavTo,
  Route,
  Routes,
  ScrollableContainer,
  Slider,
  Toggle,
  Tooltip,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";
import { usePanelStateMachine } from "/modules/stdlib/src/webpack/ReactHooks.ts";
import { useCustomSnackbar, useSnackbar } from "/modules/stdlib/src/webpack/Snackbar.js";
import { Card, type CardPropDoc } from "./Components/Card.tsx";
import { Section } from "./Components/Section.tsx";

const NOOP = () => {};

const menuProps: CardPropDoc[] = [
  {
    name: "children",
    type: "React.ReactNode",
    required: true,
    description: "MenuItem and nested submenus.",
  },
];

const contextMenuProps: CardPropDoc[] = [
  {
    name: "menu",
    type: "React.ReactNode",
    required: true,
    description: "Menu content rendered on trigger.",
  },
  { name: "trigger", type: '"right-click" | "click"', defaultValue: '"right-click"' },
  { name: "placement", type: "string", defaultValue: '"top"' },
  { name: "offset", type: "[number, number]" },
];

const tooltipProps: CardPropDoc[] = [
  { name: "label", type: "string | React.ReactNode", required: true },
  { name: "children", type: "React.ReactElement", required: true },
];

const toggleProps: CardPropDoc[] = [
  { name: "id", type: "string", required: true },
  { name: "value", type: "boolean", required: true },
  { name: "onSelected", type: "(value: boolean) => void", required: true },
];

const sliderProps: CardPropDoc[] = [
  { name: "labelText", type: "string" },
  { name: "max", type: "number", defaultValue: "100" },
  { name: "value", type: "number", required: true },
  { name: "onDragMove", type: "(percentage: number) => void" },
  { name: "onDragEnd", type: "(percentage: number) => void" },
];

const confirmDialogProps: CardPropDoc[] = [
  { name: "isOpen", type: "boolean", required: true },
  { name: "titleText", type: "string", required: true },
  { name: "descriptionText", type: "string" },
  { name: "confirmText", type: "string" },
  { name: "cancelText", type: "string" },
  { name: "onConfirm", type: "() => void", required: true },
  { name: "onClose", type: "() => void", required: true },
];

const dialogProps: CardPropDoc[] = [
  { name: "isOpen", type: "boolean", required: true },
  { name: "onClose", type: "() => void", required: true },
  { name: "animated", type: "boolean", defaultValue: "true" },
  { name: "shouldCloseOnBackdropClick", type: "boolean", defaultValue: "true" },
  { name: "children", type: "React.ReactNode", required: true },
];

const scrollableProps: CardPropDoc[] = [
  {
    name: "children",
    type: "React.ReactNode",
    required: true,
    description: "Scrollable horizontal/overflow content.",
  },
];

const cardsProps: CardPropDoc[] = [
  {
    name: "Cards.Generic",
    type: "component",
    required: true,
    description: "Generic card shell with image/title/subheader slots.",
  },
  {
    name: "Cards.HeroGeneric",
    type: "component",
    required: true,
    description: "Hero variant with signifier region.",
  },
  { name: "uri", type: "string", required: true },
  { name: "isPlayable", type: "boolean", defaultValue: "false" },
  { name: "renderCardImage", type: "() => React.ReactNode" },
];

const routesProps: CardPropDoc[] = [
  { name: "Routes", type: "container", required: true },
  { name: "Route.path", type: "string", required: true },
  { name: "Route.element", type: "React.ReactElement", required: true },
];

const navToProps: CardPropDoc[] = [
  { name: "to", type: "string", required: true },
  { name: "replace", type: "boolean", defaultValue: "false" },
  { name: "children", type: "React.ReactNode" },
];

const ToggleDemo = () => {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <div className="test-demo-toggle-row">
      <Toggle
        id="toggle-probe"
        onSelected={(newValue: boolean) => {
          setIsChecked(newValue);
        }}
        value={isChecked}
      />
      <span>State: {isChecked ? "ON" : "OFF"}</span>
    </div>
  );
};

const SliderDemo = () => {
  const [value, setValue] = React.useState(50);
  const max = 100;

  return (
    <Slider
      labelText="Volume Level"
      max={max}
      onDragEnd={(percentage: number) => console.log("Final value:", percentage * max)}
      onDragMove={(percentage: number) => setValue(percentage * max)}
      value={value}
    />
  );
};

const ConfirmDialogDemo = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ConfirmDialog
        cancelText="Cancel"
        confirmText="Confirm"
        descriptionText="Description Text."
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          console.log("Confirmed!");
          setIsOpen(false);
        }}
        onOutside={() => setIsOpen(false)}
        titleText="Title Text"
      />
      <button className="test-page-btn" onClick={() => setIsOpen(true)}>
        Open Confirm Dialog
      </button>
    </>
  );
};

const DialogDemo = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Dialog
        animated={true}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shouldCloseOnBackdropClick={true}
      >
        <div className="test-dialog-content">
          <h1>Custom Dialog Content</h1>
          <p>This is a dialog component.</p>
          <button className="test-page-btn" onClick={() => setIsOpen(false)}>
            Close Me
          </button>
        </div>
      </Dialog>

      <button className="test-page-btn" onClick={() => setIsOpen(true)}>
        Open Dialog
      </button>
    </>
  );
};

const GenericModalDemo = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <GenericModal
        animated={true}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shouldCloseOnBackdropClick={true}
      >
        <div className="test-dialog-content">
          <h1>Custom GenericModal Content</h1>
          <p>This is a GenericModal component.</p>
          <button className="test-page-btn" onClick={() => setIsOpen(false)}>
            Close Me
          </button>
        </div>
      </GenericModal>

      <button className="test-page-btn" onClick={() => setIsOpen(true)}>
        Open GenericModal
      </button>
    </>
  );
};

export const ReactComponentPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { enqueueCustomSnackbar } = useCustomSnackbar();
  const [panelState, panelService, panelMachine] = usePanelStateMachine();
  console.log("panelState", panelState);
  console.log("panelService", panelService);
  console.log("panelMachine", panelMachine);

  return (
    <div className="test-showcase-page test-showcase-page--react">
      <Section
        description="Reference + live playground for every React component currently exposed through ReactComponents.ts in this page."
        title="Stdlib React Components"
      >
        <Card
          props={[
            { name: "Preview", type: "Live component output", required: true },
            { name: "Props", type: "name + type + notes", required: true },
          ]}
          subtitle="Each card has a live preview and a typed props block for quick copy/paste usage."
          title="How to use this page"
        >
          <div className="test-demo-grid-tight">
            <span>1. Find a component section.</span>
            <span>2. Interact with the demo.</span>
            <span>3. Read the props block under the preview.</span>
          </div>
        </Card>
      </Section>

      <Section
        description="Surface-level navigation, menus, and route controls."
        title="Navigation and Menus"
      >
        <Card props={menuProps} title="Menu + MenuItem + MenuItemSubMenu">
          <Menu>
            <MenuItem onClick={NOOP}>Menu item</MenuItem>
            <MenuItemSubMenu depth={1} displayText="Sub menu" placement="right-start">
              <MenuItem onClick={NOOP}>Nested item</MenuItem>
            </MenuItemSubMenu>
          </Menu>
        </Card>

        <Card props={contextMenuProps} title="ContextMenu">
          <ContextMenu
            menu={
              <Menu>
                <MenuItem onClick={NOOP}>Context action</MenuItem>
              </Menu>
            }
            offset={[0, 8]}
            placement="top"
            trigger="right-click"
          >
            <button className="test-page-btn" type="button">
              Right click this target
            </button>
          </ContextMenu>
        </Card>

        <Card props={tooltipProps} title="Tooltip">
          <Tooltip label="Tooltip probe">
            <button className="test-page-btn" type="button">
              Hover for tooltip
            </button>
          </Tooltip>
        </Card>

        <Card props={navToProps} title="NavTo">
          {React.createElement(
            NavTo as React.ElementType,
            { to: "/home", replace: true },
            "Go to /home",
          )}
        </Card>

        <Card props={routesProps} title="Routes + Route">
          <Routes>
            <Route element={<div>shows when /home</div>} path="/home" />
            <Route element={<div>shows when /test</div>} path="/test" />
          </Routes>
        </Card>
      </Section>

      <Section
        description="Interactive controls, sliders, dialogs, and modal containers."
        title="Input and Feedback"
      >
        <Card props={toggleProps} title="Toggle">
          <ToggleDemo />
        </Card>

        <Card props={sliderProps} title="Slider">
          <SliderDemo />
        </Card>

        <Card props={confirmDialogProps} title="ConfirmDialog">
          <ConfirmDialogDemo />
        </Card>

        <Card props={dialogProps} title="Dialog">
          <DialogDemo />
        </Card>

        <Card props={dialogProps} title="GenericModal">
          <GenericModalDemo />
        </Card>

        <Card props={scrollableProps} title="ScrollableContainer">
          <div className="test-demo-scroll-wrap">
            <ScrollableContainer>
              <button className="test-page-btn" type="button">
                Item A
              </button>
              <button className="test-page-btn" type="button">
                Item B
              </button>
              <button className="test-page-btn" type="button">
                Item C
              </button>
              <button className="test-page-btn" type="button">
                Item D
              </button>
              <button className="test-page-btn" type="button">
                Item E
              </button>
              <button className="test-page-btn" type="button">
                Item F
              </button>
            </ScrollableContainer>
          </div>
        </Card>

        <Card title="Snackbar">
          <button
            className="test-page-btn"
            onClick={() => enqueueSnackbar(<span>Hello!</span>, { variant: "default" })}
            type="button"
          >
            Show Toast
          </button>
          <button
            className="test-page-btn"
            onClick={() => {
              enqueueCustomSnackbar(
                <div style={{ background: "purple", padding: "10px", color: "white" }}>
                  <span>Custom Headless Hello!</span>
                </div>,
                {
                  identifier: "my-unique-toast-id",
                  autoHideDuration: 3000,
                  anchorOrigin: { vertical: "top", horizontal: "right" },
                },
              );
            }}
            type="button"
          >
            Show Custom Toast
          </button>
        </Card>
      </Section>

      <Section
        description="Album/playlist card patterns with thumbnail, metadata, and playback affordances."
        title="Cards API"
      >
        <Card props={cardsProps} title="Cards.Generic + Cards.HeroGeneric">
          <Cards.Generic
            headerText="Default Generic Card"
            isPlayable={true}
            onClick={(uri: string) => console.log("Clicked card:", uri)}
            renderCardImage={() => (
              <img className="test-demo-img-cover" src="https://placehold.co/100" />
            )}
            renderSubHeaderContent={() => "Artist Name"}
            showTitle={true}
            titleLineClamp={2}
            uri="spotify:album:12345"
            variant="default"
          />
          <Cards.HeroGeneric
            getSignifierContent={() => (
              <span className="test-featured-signifier">Featured Playlist</span>
            )}
            headerText="Todays Top Hits"
            isPlayable={true}
            renderCardImage={() => (
              <img className="test-demo-img-rounded" src="https://placehold.co/100" />
            )}
            renderSubHeaderContent={() => "The hottest tracks right now."}
            uri="spotify:playlist:37i9dQZF1DXcBWIGoYBM3M"
          />
        </Card>
      </Section>
    </div>
  );
};

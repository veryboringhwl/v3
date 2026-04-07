import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  Cards,
  ConfirmDialog,
  ContextMenu,
  Dialog,
  GenericModal,
  InstrumentedRedirect,
  Menu,
  MenuItem,
  MenuItemSubMenu,
  Menus,
  Nav,
  NavTo,
  RemoteConfigProvider,
  RightClickMenu,
  Route,
  Router,
  Routes,
  ScrollableContainer,
  Settings,
  Snackbar,
  SnackbarProvider,
  StoreProvider,
  Toggle,
  Tooltip,
  Tracklist,
  TracklistColumnsContextProvider,
  TracklistRow,
} from "/modules/stdlib/src/webpack/ReactComponents.ts";

const NOOP = () => {};
const _LONG_TEXT =
  "The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.";

const renderProbe = (
  Component?: unknown,
  props: Record<string, unknown> = {},
  children?: React.ReactNode,
) => {
  if (!Component || (typeof Component !== "function" && typeof Component !== "string")) {
    return <span>Loading...</span>;
  }

  return React.createElement(
    Component as React.ElementType,
    props as React.Attributes & Record<string, unknown>,
    children,
  );
};

const _additionalProbes: Array<{
  title: string;
  render: () => React.ReactNode;
}> = [
  { title: "<Settings />", render: () => renderProbe(Settings) },
  { title: "<Menus />", render: () => renderProbe(Menus) },
  {
    title: "<Cards />",
    render: () => renderProbe(Cards, {}, <div>Card body</div>),
  },
  {
    title: "<RemoteConfigProviderComponent />",
    render: () => renderProbe(RemoteConfigProviderComponent, {}, <div>Remote config</div>),
  },
  {
    title: "<Nav />",
    render: () => (Nav ? renderProbe(Nav, { to: "/home" }, "Navigate") : <span>Loading...</span>),
  },
  {
    title: "<InstrumentedRedirect />",
    render: () =>
      typeof InstrumentedRedirect === "function" ? <span>Loaded</span> : <span>Loading...</span>,
  },
  {
    title: "<SnackbarProvider />",
    render: () => renderProbe(SnackbarProvider, {}, <button type="button">Snackbar child</button>),
  },
  {
    title: "<RightClickMenu />",
    render: () => {
      if (!RightClickMenu || !Menu || !MenuItem) return <span>Loading...</span>;
      return renderProbe(
        RightClickMenu,
        {
          trigger: "right-click",
          placement: "top",
          offset: [0, 8],
          menu: React.createElement(
            Menu as React.ElementType,
            null,
            React.createElement(
              MenuItem as React.ElementType,
              { onClick: NOOP },
              "Right-click action",
            ),
          ),
        },
        React.createElement("button", { type: "button" }, "Right click me"),
      );
    },
  },
  {
    title: "<RemoteConfigProvider />",
    render: () => renderProbe(RemoteConfigProvider),
  },
  {
    title: "<Snackbar />",
    render: () => renderProbe(Snackbar, {}, "Snackbar content"),
  },
  {
    title: "<Router />",
    render: () => {
      if (!Router || !Routes || !Route) return <span>Loading...</span>;
      return renderProbe(
        Router,
        {},
        React.createElement(
          Routes as React.ElementType,
          null,
          React.createElement(Route as React.ElementType, {
            path: "/",
            element: React.createElement("div", null, "Router route"),
          }),
        ),
      );
    },
  },
  {
    title: "<StoreProvider />",
    render: () => renderProbe(StoreProvider, {}, <div>Store wrapper</div>),
  },
  { title: "<Tracklist />", render: () => renderProbe(Tracklist) },
  {
    title: "<TracklistColumnsContextProvider />",
    render: () => renderProbe(TracklistColumnsContextProvider, {}, <div>Columns context</div>),
  },
  {
    title: "<TracklistRow />",
    render: () =>
      typeof TracklistRow === "function" ? <span>Loaded</span> : <span>Loading...</span>,
  },
];

const ProbeCard = ({ title, render }: { title: string; render?: () => React.ReactNode }) => {
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
      <strong>{title}</strong>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "8px",
          padding: "8px",
          minHeight: "48px",
        }}
      >
        {render?.()}
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div style={{ display: "grid", gap: "10px" }}>
    <h3 style={{ margin: 0 }}>{title}</h3>
    {children}
  </div>
);

export const TestPage = () => {
  return (
    <div style={{ padding: "24px", color: "white", display: "grid", gap: "16px" }}>
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
            render={() => (
              <Menu>
                <MenuItem onClick={NOOP}>Menu item</MenuItem>
                <MenuItemSubMenu depth={1} displayText="Sub menu" placement="right-start">
                  <MenuItem onClick={NOOP}>Nested item</MenuItem>
                </MenuItemSubMenu>
              </Menu>
            )}
            title="<Menu />"
          />
        </Section>

        <Section title="Context Menu">
          <ProbeCard
            render={() => (
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
                <button type="button">Right click this target</button>
              </ContextMenu>
            )}
            title="<ContextMenu />"
          />
        </Section>

        <Section title="Tooltip">
          <ProbeCard
            render={() => (
              <Tooltip label="Tooltip probe">
                <button type="button">Hover for tooltip</button>
              </Tooltip>
            )}
            title="<Tooltip />"
          />
        </Section>

        {/*<Section title="FilterBox">
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
				</Section>*/}

        <Section title="Toggle">
          <ProbeCard
            render={() => {
              const [isChecked, setIsChecked] = React.useState(false);

              return (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Toggle
                    id="toggle-probe"
                    onSelected={(newValue) => {
                      setIsChecked(newValue);
                    }}
                    value={isChecked}
                  />
                  <span>State: {isChecked ? "ON" : "OFF"}</span>
                </div>
              );
            }}
            render={() => {
              const [isChecked, setIsChecked] = React.useState(false);

              return (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Toggle
                    id="toggle-probe"
                    onSelected={(newValue) => {
                      setIsChecked(newValue);
                    }}
                    value={isChecked}
                  />
                  <span>State: {isChecked ? "ON" : "OFF"}</span>
                </div>
              );
            }}
          />
        </Section>

        <Section title="ConfirmDialog">
          <ProbeCard
            render={() => {
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

                  <button onClick={() => setIsOpen(true)}>Open Confirm Dialog</button>
                </>
              );
            }}
            render={() => {
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

                  <button onClick={() => setIsOpen(true)}>Open Confirm Dialog</button>
                </>
              );
            }}
          />
        </Section>
        <Section title="Dialog">
          <ProbeCard
            render={() => {
              const [isOpen, setIsOpen] = React.useState(false);

              return (
                <>
                  <Dialog
                    animated={true}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    shouldCloseOnBackdropClick={true}
                  >
                    <div
                      style={{
                        padding: "24px",
                        background: "var(--background-base)",
                        color: "white",
                      }}
                    >
                      <h1>Custom Dialog Content</h1>
                      <p>This is a dialog component.</p>
                      <button onClick={() => setIsOpen(false)}>Close Me</button>
                    </div>
                  </Dialog>

                  <button onClick={() => setIsOpen(true)}>Open Dialog</button>
                </>
              );
            }}
            title="<Dialog />"
          />
        </Section>
        <Section title="GenericModal">
          <ProbeCard
            render={() => {
              const [isOpen, setIsOpen] = React.useState(false);

              return (
                <>
                  <GenericModal
                    animated={true}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    shouldCloseOnBackdropClick={true}
                  >
                    <div
                      style={{
                        padding: "24px",
                        background: "var(--background-base)",
                        color: "white",
                      }}
                    >
                      <h1>Custom GenericModal Content</h1>
                      <p>This is a GenericModal component.</p>
                      <button onClick={() => setIsOpen(false)}>Close Me</button>
                    </div>
                  </GenericModal>

                  <button onClick={() => setIsOpen(true)}>Open GenericModal</button>
                </>
              );
            }}
            title="<GenericModal />"
          />
        </Section>

        <Section title="ScrollableContainer">
          <ProbeCard
            render={() => (
              <div style={{ display: "flex", gap: "8px", maxWidth: "200px" }}>
                <ScrollableContainer>
                  <button type="button">Item A</button>
                  <button type="button">Item B</button>
                  <button type="button">Item C</button>
                  <button type="button">Item D</button>
                  <button type="button">Item E</button>
                  <button type="button">Item F</button>
                </ScrollableContainer>{" "}
              </div>
            )}
            title="<ScrollableContainer />"
          />
        </Section>

        <Section title="Cards">
          <ProbeCard
            render={() => (
              <>
                <Cards.Generic
                  headerText="Default Generic Card"
                  isPlayable={true}
                  onClick={(uri) => console.log("Clicked card:", uri)}
                  renderCardImage={() => (
                    <img
                      src="https://lineup-images.scdn.co/your-image-url"
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  renderSubHeaderContent={() => "Artist Name"}
                  showTitle={true}
                  titleLineClamp={2}
                  uri="spotify:album:12345"
                  variant="default"
                />
                <Cards.HeroGeneric
                  // Unique Hero Props
                  getSignifierContent={() => (
                    <span style={{ color: "#1db954" }}>Featured Playlist</span>
                  )}
                  headerText="Todays Top Hits"
                  isPlayable={true}
                  renderCardImage={() => (
                    <img
                      src="https://i.scdn.co/image/ab67706f00000002fe24d7051005da37e2448378"
                      style={{ width: "100%", borderRadius: "8px" }}
                    />
                  )}
                  renderSubHeaderContent={() => "The hottest tracks right now."}
                  uri="spotify:playlist:37i9dQZF1DXcBWIGoYBM3M"
                />
              </>
            )}
            render={() => (
              <>
                <Cards.Generic
                  headerText="Default Generic Card"
                  isPlayable={true}
                  onClick={(uri) => console.log("Clicked card:", uri)}
                  renderCardImage={() => (
                    <img
                      src="https://lineup-images.scdn.co/your-image-url"
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  renderSubHeaderContent={() => "Artist Name"}
                  showTitle={true}
                  titleLineClamp={2}
                  uri="spotify:album:12345"
                  variant="default"
                />
                <Cards.HeroGeneric
                  // Unique Hero Props
                  getSignifierContent={() => (
                    <span style={{ color: "#1db954" }}>Featured Playlist</span>
                  )}
                  headerText="Todays Top Hits"
                  isPlayable={true}
                  renderCardImage={() => (
                    <img
                      src="https://i.scdn.co/image/ab67706f00000002fe24d7051005da37e2448378"
                      style={{ width: "100%", borderRadius: "8px" }}
                    />
                  )}
                  renderSubHeaderContent={() => "The hottest tracks right now."}
                  uri="spotify:playlist:37i9dQZF1DXcBWIGoYBM3M"
                />
              </>
            )}
          />
        </Section>

        <Section title="Routes and Route">
          <ProbeCard
            render={() => (
              <Routes>
                <Route element={<div>shows when /home</div>} path="/ho" />
                <Route element={<div>shows when /test</div>} path="/test" />
              </Routes>
            )}
            title="<Routes /><Route />"
          />
        </Section>

        <Section title="NavTo">
          <ProbeCard
            render={() =>
              React.createElement(
                NavTo as React.ElementType,
                { to: "/home", replace: true },
                "Go to /home",
              )
            }
            title="<NavTo />"
          />
        </Section>
      </div>
    </div>
  );
};

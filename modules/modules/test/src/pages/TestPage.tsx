import { React } from "/modules/stdlib/src/expose/React.ts";
import {
  Cards,
  ContextMenu,
  InstrumentedRedirect,
  Menu,
  MenuItem,
  MenuItemSubMenu,
  Menus,
  Nav,
  NavTo,
  RemoteConfigProvider,
  RemoteConfigProviderComponent,
  RightClickMenu,
  Route,
  Routes,
  Router,
  ScrollableContainer,
  Settings,
  Snackbar,
  SnackbarProvider,
  StoreProvider,
  Tracklist,
  TracklistColumnsContextProvider,
  TracklistRow,
  Toggle,
  Tooltip,
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
            title="<Menu />"
            render={() => (
              <Menu>
                <MenuItem onClick={NOOP}>Menu item</MenuItem>
                <MenuItemSubMenu depth={1} displayText="Sub menu" placement="right-start">
                  <MenuItem onClick={NOOP}>Nested item</MenuItem>
                </MenuItemSubMenu>
              </Menu>
            )}
          />
        </Section>

        <Section title="Context Menu">
          <ProbeCard
            title="<ContextMenu />"
            render={() => (
              <ContextMenu
                trigger="right-click"
                placement="top"
                offset={[0, 8]}
                menu={
                  <Menu>
                    <MenuItem onClick={NOOP}>Context action</MenuItem>
                  </Menu>
                }
              >
                <button type="button">Right click this target</button>
              </ContextMenu>
            )}
          />
        </Section>

        <Section title="Tooltip">
          <ProbeCard
            title="<Tooltip />"
            render={() => (
              <Tooltip label="Tooltip probe">
                <button type="button">Hover for tooltip</button>
              </Tooltip>
            )}
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
            title="<Toggle />"
            render={() => {
              const [isChecked, setIsChecked] = React.useState(false);

              return (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Toggle
                    id="toggle-probe"
                    value={isChecked}
                    onSelected={(newValue) => {
                      setIsChecked(newValue);
                    }}
                  />
                  <span>State: {isChecked ? "ON" : "OFF"}</span>
                </div>
              );
            }}
          />
        </Section>

        <Section title="ScrollableContainer">
          <ProbeCard
            title="<ScrollableContainer />"
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
          />
        </Section>

        {/*<Section title="ScrollableText">
					<ProbeCard
						title="<ScrollableText />"
						render={() => <ScrollableText>{_LONG_TEXT}</ScrollableText>}
					/>
				</Section>*/}

        <Section title="Routes and Route">
          <ProbeCard
            title="<Routes /><Route />"
            render={() => (
              <Routes>
                <Route path="/ho" element={<div>shows when /home</div>} />
                <Route path="/test" element={<div>shows when /test</div>} />
              </Routes>
            )}
          />
        </Section>

        <Section title="NavTo">
          <ProbeCard
            title="<NavTo />"
            render={() =>
              React.createElement(
                NavTo as React.ElementType,
                { to: "/home", replace: true },
                "Go to /home",
              )
            }
          />
        </Section>
      </div>
    </div>
  );
};

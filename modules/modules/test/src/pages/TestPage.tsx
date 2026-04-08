import { React } from "/modules/stdlib/src/expose/React.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
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

const NOOP = () => {};

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
      <Section title="Cards (Detailed)">
        <ProbeCard
          render={() => (
            <div style={{ width: "200px" }}>
              <UI.Card id="card-probe">
                <UI.CardTitle variant="bodyMediumBold">Card Title</UI.CardTitle>
                <UI.CardSubtitle>Card Subtitle</UI.CardSubtitle>
                <UI.CardDetails hasTextSeparator>
                  {[<span>2024</span>, <span>Album</span>, <span>12 tracks</span>]}
                </UI.CardDetails>
              </UI.Card>
              <UI.Box
                borderRadius="base"
                padding="base"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <UI.CardImage alt="Probe" borderRadius="base" src="https://placehold.co/100" />
                <UI.Box paddingBlockStart="tighter"></UI.Box>
              </UI.Box>
            </div>
          )}
          render={() => (
            <div style={{ width: "200px" }}>
              <UI.Card id="card-probe">
                <UI.CardTitle variant="bodyMediumBold">Card Title</UI.CardTitle>
                <UI.CardSubtitle>Card Subtitle</UI.CardSubtitle>
                <UI.CardDetails hasTextSeparator>
                  {[<span>2024</span>, <span>Album</span>, <span>12 tracks</span>]}
                </UI.CardDetails>
              </UI.Card>
              <UI.Box
                borderRadius="base"
                padding="base"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <UI.CardImage alt="Probe" borderRadius="base" src="https://placehold.co/100" />
                <UI.Box paddingBlockStart="tighter"></UI.Box>
              </UI.Box>
            </div>
          )}
        />
      </Section>

      <Section title="Media & Icons">
        <ProbeCard
          render={() => (
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ display: "grid", justifyItems: "center" }}>
                <UI.Icon semanticColor="textBrightAccent" size="xlarge" />
                <UI.Text variant="marginal">Icon Wrapper</UI.Text>
              </div>
              <UI.Image
                alt="Circular Image"
                circle
                imageHeight="64px"
                imageWidth="64px"
                src="https://placehold.co/100"
              />
            </div>
          )}
          title="UI.Icon & UI.Image"
        />
      </Section>

      <Section title="Advanced Forms">
        <ProbeCard
          render={() => (
            <UI.FormInputIcon
              iconLeading={() => <div style={{ padding: "8px" }}>🔍</div>}
              iconTrailing={() => <div style={{ padding: "8px" }}>❌</div>}
            >
              <UI.FormInput placeholder="Search with icons..." />
            </UI.FormInputIcon>
          )}
          title="UI.FormInputIcon"
        />
      </Section>

      <Section title="Overlays">
        <ProbeCard
          render={() => (
            <div style={{ position: "relative", height: "120px" }}>
              <UI.Popover
                arrow="bottom"
                onClose={() => console.log("Close clicked")}
                popoverTitle="Popover Probe"
              >
                <UI.Box padding="base">
                  This is the internal content of the Popover component.
                </UI.Box>
              </UI.Popover>
            </div>
          )}
          title="UI.Popover"
        />
      </Section>

      <Section title="Lists & Types">
        <ProbeCard
          render={() => (
            <UI.TypeList condensed>
              <li>
                <UI.Text variant="bodySmall">Type List Item 1</UI.Text>
              </li>
              <li>
                <UI.Text variant="bodySmall">Type List Item 2</UI.Text>
              </li>
              <li>
                <UI.Text variant="bodySmall">Type List Item 3</UI.Text>
              </li>
            </UI.TypeList>
          )}
          title="UI.TypeList"
        />
        <ProbeCard
          render={() => (
            <div>
              <UI.Text variant="bodySmall">There is text below you cannot see:</UI.Text>
              <UI.VisuallyHidden>I am only visible to screen readers!</UI.VisuallyHidden>
            </div>
          )}
          title="UI.VisuallyHidden"
        />
      </Section>
      <Section title="Typography & Text">
        <ProbeCard
          render={() => (
            <div style={{ display: "grid", gap: "10px" }}>
              <UI.Text variant="headlineLarge">Headline Large</UI.Text>
              <UI.Type.h2 variant="titleMedium">Title Medium (h2)</UI.Type.h2>
              <UI.Text semanticColor="textSubdued" variant="bodyMedium">
                Body Medium with Subdued Semantic Color
              </UI.Text>
              <UI.Text lineClamp={1} style={{ width: "100px" }} variant="bodySmall">
                This is a very long text that should be clamped to one line.
              </UI.Text>
              <UI.TextLink href="#" standalone>
                Standalone Text Link
              </UI.TextLink>
            </div>
          )}
          title="UI.Text & UI.Type"
        />
        <ProbeCard
          render={() => (
            <div
              style={{
                width: "100%",
                border: "1px dashed gray",
                resize: "horizontal",
                overflow: "hidden",
              }}
            >
              <UI.AdaptiveTitle
                maximumTextStyle="headlineLarge"
                maxLines={1}
                minimumTextStyle="titleSmall"
              >
                I Scale Based on Container Width
              </UI.AdaptiveTitle>
              <UI.Text semanticColor="textSubdued" variant="marginal">
                (Resize container to test)
              </UI.Text>
            </div>
          )}
          title="UI.AdaptiveTitle"
        />
      </Section>

      <Section title="Buttons & Interaction">
        <ProbeCard
          render={() => (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <UI.ButtonPrimary>Primary</UI.ButtonPrimary>
              <UI.ButtonSecondary>Secondary</UI.ButtonSecondary>
              <UI.ButtonTertiary>Tertiary</UI.ButtonTertiary>
              <UI.ButtonPrimary disabled>Disabled</UI.ButtonPrimary>
            </div>
          )}
          title="UI.Button variants"
        />
        <ProbeCard
          render={() => (
            <div style={{ display: "flex", gap: "8px" }}>
              <UI.Chip size="md" variant="tinted">
                Tinted Chip
              </UI.Chip>
              <UI.Chip selected size="md" variant="bordered">
                Selected Bordered
              </UI.Chip>
              <UI.Chip size="md" variant="contrasting">
                Contrasting
              </UI.Chip>
            </div>
          )}
          title="UI.Chip"
        />
      </Section>

      <Section title="Layout & Containers">
        <ProbeCard
          render={() => (
            <div style={{ display: "flex", gap: "10px" }}>
              <UI.Box
                borderRadius="base"
                padding="base"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                Standard Box
              </UI.Box>
              <UI.Box
                borderRadius="round"
                hoverBackgroundColor="backgroundHighlight"
                isInteractive
                padding="base"
              >
                Interactive Round Box
              </UI.Box>
            </div>
          )}
          title="UI.Box"
        />
        <ProbeCard
          render={() => (
            <UI.List hasDividers>
              <UI.ListRow
                id="row-1"
                media="https://placehold.co/100"
                subtitle="List Row Subtitle"
                title="List Row Title"
                trailing={<UI.ButtonTertiary size="small">Action</UI.ButtonTertiary>}
              />
              <UI.ListRow
                id="row-2"
                onClick={() => console.log("Row Clicked")}
                title="Interactive Row"
              />
            </UI.List>
          )}
          title="UI.List & UI.ListRow"
        />
      </Section>

      <Section title="Forms">
        <ProbeCard
          render={() => (
            <div style={{ display: "grid", gap: "15px" }}>
              <UI.FormInput placeholder="Standard Input" />
              <UI.FormInput error placeholder="Input with Error" />
              <UI.FormTextarea placeholder="Standard Textarea" rows={3} />
              <UI.FormCheckbox id="check-1">Checkbox Label</UI.FormCheckbox>
            </div>
          )}
          title="Inputs & Checkboxes"
        />
      </Section>

      <Section title="Feedback & Brand">
        <ProbeCard
          render={() => (
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <UI.ProgressCircle size="medium" variant="indeterminate" />
              <UI.ProgressDots size="medium" />
              <UI.LogoSpotify style={{ height: "24px" }} useBrandColor />
              <UI.LogoSpotify condensed style={{ height: "24px" }} />
            </div>
          )}
          render={() => (
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <UI.ProgressCircle size="medium" variant="indeterminate" />
              <UI.ProgressDots size="medium" />
              <UI.LogoSpotify style={{ height: "24px" }} useBrandColor />
              <UI.LogoSpotify condensed style={{ height: "24px" }} />
            </div>
          )}
        />
        <ProbeCard
          render={() => (
            <div>
              <UI.Text variant="bodySmall">Above Rule</UI.Text>
              <UI.HorizontalRule />
              <UI.Text variant="bodySmall">Below Rule</UI.Text>
            </div>
          )}
          title="UI.HorizontalRule"
        />
      </Section>

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
        />
      </Section>
      <Section title="Slider">
        <ProbeCard
          render={() => {
            const [value, setValue] = React.useState(50);
            const max = 100;
            return (
              <Slider
                labelText="Volume Level"
                max={max}
                onDragEnd={(percentage) => console.log("Final value:", percentage * max)}
                onDragMove={(percentage) => setValue(percentage * max)}
                value={value}
              />
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
                    src="https://placehold.co/100"
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
                    src="https://placehold.co/100"
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
  );
};

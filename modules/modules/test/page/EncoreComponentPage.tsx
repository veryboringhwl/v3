import type { React } from "/modules/stdlib/src/expose/React.ts";
import { UI } from "/modules/stdlib/src/webpack/ComponentLibrary.ts";
import { Card, type CardPropDoc } from "./Components/Card.tsx";
import { Section } from "./Components/Section.tsx";

const Icon = (props: React.ComponentProps<typeof UI.Icon>) => (
  <UI.Icon {...props} viewBox="0 0 24 24">
    <path
      d="M3 3h2l.5 3m0 0L7 15h11l3-9H5.5z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <circle cx="8" cy="20" r="1" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="20" r="1" stroke="currentColor" strokeWidth="2" />
  </UI.Icon>
);

const buttonProps: CardPropDoc[] = [
  { name: "size", type: '"small" | "medium" | "large"', defaultValue: '"medium"' },
  { name: "iconOnly", type: "React.ElementType" },
  { name: "onClick", type: "() => void" },
  { name: "aria-label", type: "string", required: true },
];

const formInputProps: CardPropDoc[] = [
  { name: "placeholder", type: "string" },
  { name: "error", type: "boolean", defaultValue: "false" },
  { name: "size", type: '"small" | "medium" | "large"', defaultValue: '"medium"' },
];

const textProps: CardPropDoc[] = [
  { name: "variant", type: "string", defaultValue: '"bodyMedium"' },
  { name: "semanticColor", type: "string" },
  { name: "lineClamp", type: "number" },
  { name: "as", type: "React.ElementType" },
];

const listRowProps: CardPropDoc[] = [
  { name: "id", type: "string", required: true },
  { name: "title", type: "React.ReactNode" },
  { name: "subtitle", type: "React.ReactNode" },
  { name: "media", type: "string" },
  { name: "trailing", type: "React.ReactNode" },
  { name: "onClick", type: "(e: React.MouseEvent) => void" },
];

const iconProps: CardPropDoc[] = [
  { name: "size", type: '"xsmall" | "small" | "medium" | "large" | "xlarge"' },
  { name: "semanticColor", type: "string" },
  { name: "viewBox", type: "string" },
];

const popoverProps: CardPropDoc[] = [
  { name: "popoverTitle", type: "string" },
  { name: "arrow", type: '"top" | "bottom" | "left" | "right"' },
  { name: "onClose", type: "() => void" },
  { name: "children", type: "React.ReactNode", required: true },
];

export const EncoreComponentPage = () => {
  return (
    <div className="test-showcase-page test-showcase-page--encore">
      <Section description="Title" title="Title">
        <Card props={textProps} title="UI.AdaptiveTitle">
          <div className="test-demo-adaptive-box">
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
        </Card>
      </Section>
      <Section description="Box." title="Box">
        <Card
          props={[
            { name: "padding", type: "string | number" },
            { name: "borderRadius", type: "string" },
            { name: "isInteractive", type: "boolean" },
          ]}
          title="UI.Box"
        >
          <div className="test-demo-flex-wrap">
            <UI.Box borderRadius="base" className="test-ui-box-muted" padding="base">
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
        </Card>
      </Section>

      <Section description="Core action surfaces and icon wrappers." title="Buttons">
        <Card props={buttonProps} title="UI.ButtonPrimary">
          <UI.ButtonPrimary
            aria-label="Add to cart"
            iconOnly={Icon}
            onClick={() => console.log("Clicked!")}
            size="large"
          />
        </Card>
        <Card props={buttonProps} title="UI.ButtonSecondary">
          <UI.ButtonSecondary
            aria-label="Add to cart"
            iconOnly={Icon}
            onClick={() => console.log("Clicked!")}
            size="large"
          />
        </Card>
        <Card props={buttonProps} title="UI.ButtonTertiary">
          <UI.ButtonTertiary
            aria-label="Add to cart"
            iconOnly={Icon}
            onClick={() => console.log("Clicked!")}
            size="large"
          />
        </Card>
      </Section>

      <Section description="Structured data display components." title="Cards">
        <Card
          props={[
            { name: "id", type: "string" },
            { name: "title", type: "React.ReactNode" },
            { name: "subtitle", type: "React.ReactNode" },
            { name: "body", type: "React.ReactNode" },
            { name: "pretitle", type: "React.ReactNode" },
            { name: "media", type: "string | React.ReactNode" },
            { name: "size", type: '"sm" | "md"' },
            { name: "onClick", type: "(e: React.MouseEvent) => void" },
            { name: "disabled", type: "boolean" },
          ]}
          title="UI.Card details"
        >
          <UI.Card
            id="card-probe"
            media={<div>Media stuff</div>}
            onClick={() => console.log("Card clicked")}
            pretitle="Card Pretitle"
            subtitle="Card Subtitle"
            title="Card Title"
          />
          <UI.Card id="card-probe" subtitle="Card Subtitle" title="Card Title" />
        </Card>
      </Section>

      <Section description="Structured data display components." title="Chips">
        <Card
          props={[
            { name: "id", type: "string" },
            { name: "title", type: "React.ReactNode" },
            { name: "subtitle", type: "React.ReactNode" },
            { name: "body", type: "React.ReactNode" },
            { name: "pretitle", type: "React.ReactNode" },
            { name: "media", type: "string | React.ReactNode" },
            { name: "size", type: '"sm" | "md"' },
            { name: "onClick", type: "(e: React.MouseEvent) => void" },
            { name: "disabled", type: "boolean" },
          ]}
          title="UI.Chip details"
        >
          <UI.Chip
            index={0}
            onClick={() => console.log("Chip clicked")}
            secondary={true}
            selected={false}
            selectedColorSet="invertedLight"
            style={{ marginBlockEnd: 0, willChange: "transform, opacity" }}
            tabIndex={-1}
            title="Chip Title"
          >
            Chip
          </UI.Chip>
          <UI.Chip
            index={1}
            onClick={() => console.log("Chip clicked")}
            onClick={() => console.log("Chip clicked")}
            secondary={false}
            selected={true}
            selectedColorSet="invertedLight"
            tabIndex={0}
            title="Chip Title"
          >
            Chip2
          </UI.Chip>
        </Card>
      </Section>

      <Section description="Structured data display components." title="Lists, Cards, and Surfaces">
        <Card props={iconProps} title="UI.Icon + UI.Image">
          <div className="test-demo-media-row">
            <div className="test-demo-center-grid">
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
        </Card>
        <Card props={listRowProps} title="UI.List + UI.ListRow">
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
        </Card>
        <Card
          props={[
            { name: "condensed", type: "boolean" },
            { name: "children", type: "React.ReactNode" },
          ]}
          title="UI.TypeList + UI.VisuallyHidden"
        >
          <div className="test-demo-text-grid">
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
            <div>
              <UI.Text variant="bodySmall">There is text below you cannot see:</UI.Text>
              <UI.VisuallyHidden>I am only visible to screen readers!</UI.VisuallyHidden>
            </div>
          </div>
        </Card>
      </Section>

      <Section
        description="Typography, structure, and responsive text behavior."
        title="Text and Layout"
      >
        <Card props={textProps} title="UI.Text + UI.Type + UI.TextLink">
          <div className="test-demo-text-grid">
            <UI.Text variant="headlineLarge">Headline Large</UI.Text>
            <UI.Type as="h2" variant="titleMedium">
              Title Medium (h2)
            </UI.Type>
            <UI.Text semanticColor="textSubdued" variant="bodyMedium">
              Body Medium with Subdued Semantic Color
            </UI.Text>
            <UI.Text className="test-text-clamp-sample" lineClamp={1} variant="bodySmall">
              This is a very long text that should be clamped to one line.
            </UI.Text>
            <UI.TextLink href="#" standalone>
              Standalone Text Link
            </UI.TextLink>
          </div>
        </Card>
      </Section>

      <Section description="Input primitives and composition helpers." title="Forms and Inputs">
        <Card
          props={[
            { name: "iconLeading", type: "React.ReactElement" },
            { name: "iconTrailing", type: "React.ReactElement" },
            { name: "children", type: "React.ReactNode", required: true },
          ]}
          title="UI.FormInputIcon"
        >
          <UI.FormInputIcon
            iconLeading={<div className="test-search-icon">🔍</div>}
            iconTrailing={<div className="test-clear-icon">❌</div>}
          >
            <UI.FormInput placeholder="Search with icons..." />
          </UI.FormInputIcon>
        </Card>

        <Card props={formInputProps} title="UI.Form primitives">
          <div className="test-demo-form-grid">
            <UI.FormInput placeholder="Standard Input" />
            <UI.FormInput error placeholder="Input with Error" />
            <UI.FormTextarea placeholder="Standard Textarea" rows={3} />
            <UI.FormCheckbox id="check-1">Checkbox Label</UI.FormCheckbox>
          </div>
        </Card>
      </Section>

      <Section
        description="Popover, progress, logos, and divider elements."
        title="Overlays and Feedback"
      >
        <Card props={popoverProps} title="UI.Popover">
          <div className="test-demo-popover-wrap">
            <UI.Popover
              arrow="bottom"
              onClose={() => console.log("Close clicked")}
              popoverTitle="Popover Probe"
            >
              <UI.Box padding="base">This is the internal content of the Popover component.</UI.Box>
            </UI.Popover>
          </div>
        </Card>

        <Card
          props={[
            { name: "size", type: "string" },
            { name: "variant", type: "string" },
            { name: "useBrandColor", type: "boolean" },
          ]}
          title="UI.Progress + UI.LogoSpotify"
        >
          <div className="test-demo-progress-row">
            <UI.ProgressCircle size="medium" variant="indeterminate" />
            <UI.ProgressDots size="medium" />
            <UI.LogoSpotify className="test-logo-24" useBrandColor />
            <UI.LogoSpotify className="test-logo-24" condensed />
          </div>
        </Card>

        <Card props={[{ name: "as", type: "React.ElementType" }]} title="UI.HorizontalRule">
          <div className="test-demo-rule-wrap">
            <UI.Text variant="bodySmall">Above Rule</UI.Text>
            <UI.HorizontalRule />
            <UI.Text variant="bodySmall">Below Rule</UI.Text>
          </div>
        </Card>
      </Section>
    </div>
  );
};

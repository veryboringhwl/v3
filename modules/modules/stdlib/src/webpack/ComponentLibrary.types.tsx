export interface TextProps extends React.ComponentPropsWithoutRef<"span"> {
  as?: React.ElementType;
  variant?: string;
  semanticColor?: string;
  paddingBottom?: string | number;
  lineClamp?: number;
}

export interface AdaptiveTitleProps extends React.ComponentPropsWithoutRef<"span"> {
  trackingRef?: React.RefObject<HTMLElement>;
  maxLines?: number;
  semanticColor?: string;
  unclampedMinimum?: boolean;
  minimumWidth?: number;
  minimumTextStyle?: string;
  maximumTextStyle?: string;
  forceExtraBold?: boolean;
  style?: React.CSSProperties;
}

export interface BoxProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  variant?: string;
  colorSet?: string;
  isInteractive?: boolean;
  href?: string;
  disabled?: boolean;
  borderRadius?: string | number;
  minBlockSize?: string | number;
  padding?: string | number;
  paddingBlockStart?: string | number;
  paddingBlockEnd?: string | number;
  paddingInlineStart?: string | number;
  paddingInlineEnd?: string | number;
  hoverBackgroundColor?: string;
  activeBackgroundColor?: string;
  hoverAnimationDuration?: string;
  hasFocus?: boolean;
}

export interface ButtonPrimaryProps extends React.ComponentPropsWithoutRef<"button"> {
  as?: React.ElementType;
  size?: "small" | "medium" | "large";
  buttonSize?: string; // Legacy/Override size
  colorSet?: string; // Defaults to "brightAccent"
  fullWidth?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  iconOnly?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-hidden"?: boolean;
  href?: string; // If provided, renders as <a>
  target?: string;
  UNSAFE_colorSet?: object; // Manual color overrides
}

export interface ButtonSecondaryProps extends React.ComponentPropsWithoutRef<"button"> {
  as?: React.ElementType;
  size?: "small" | "medium" | "large";
  buttonSize?: string;
  semanticColor?: string; // Defaults to "textBase"
  fullWidth?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  iconOnly?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-hidden"?: boolean;
  href?: string;
}

export interface ButtonTertiaryProps extends React.ComponentPropsWithoutRef<"button"> {
  as?: React.ElementType;
  size?: "small" | "medium" | "large";
  buttonSize?: string;
  semanticColor?: string;
  condensed?: boolean;
  condensedAll?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  iconOnly?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-hidden"?: boolean;
  href?: string;
}

export interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  id: string; // Required for aria-labelledby logic
  size?: "sm" | "md";
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  pretitle?: React.ReactNode;
  media?: React.ReactNode; // Usually an image or artwork
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  contentAlign?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onClickHint?: string; // Screen reader hint
  onClickRole?: string; // e.g., "link"
  isRedundantOnClick?: boolean; // Changes how the clickable overlay is rendered
  isSelected?: boolean; // Renders as a switch role if boolean
  disabled?: boolean;
  "aria-disabled"?: boolean;
  titleGap?: string;
  verticalGap?: string;
  horizontalGap?: string;
  draggable?: boolean;
  onDragEnd?: (e: React.DragEvent) => void;
}

export interface CardTitleProps extends React.ComponentPropsWithoutRef<"p"> {
  as?: React.ElementType;
  variant?: string; // Default: "bodyMedium"
  weight?: string;
  lineClamp?: number;
  href?: string; // If provided, renders as <a>
  onClick?: React.MouseEventHandler;
  /** Manually override the linked subtitle/hint IDs */
  id?: string;
  "aria-describedby"?: string;
}

export interface CardSubtitleProps extends React.ComponentPropsWithoutRef<"p"> {
  id?: string;
}

export interface CardDetailsProps extends React.ComponentPropsWithoutRef<"p"> {
  as?: React.ElementType;
  variant?: string; // Default: "bodySmall"
  semanticColor?: string; // Default: "textSubdued"
  href?: string;
  weight?: string;
  lineClamp?: number;
  /** If true and children is an array, joins items with " • " */
  hasTextSeparator?: boolean;
}

export interface CardImageProps extends React.ComponentPropsWithoutRef<"img"> {
  size?: "sm" | "md"; // Default: "md"
  imageWidth?: string | number;
  imageHeight?: string | number;
  borderRadius?: string | number;
  alt?: string;
}

export interface ChipProps extends React.ComponentPropsWithoutRef<"button"> {
  as?: React.ElementType;
  href?: string; // If provided, renders as <a>
  size?: "sm" | "md"; // Default: "sm"
  variant?: "tinted" | "contrasting" | "bordered";
  selected?: boolean;
  selectedColorSet?: string; // Default: "inverted"
  secondary?: boolean;
  disabled?: boolean;
  imageSrc?: string; // Renders a small circular image leading the label
  iconLeading?: React.ElementType;
  iconTrailing?: React.ElementType;
  iconLeadingIsHidden?: boolean;
  iconTrailingIsHidden?: boolean;
  role?: string; // Default: "checkbox" (or "link" if href exists)
  "aria-checked"?: boolean;
  "data-encore-chip-id"?: string;
}

export interface FormCheckboxProps extends React.ComponentPropsWithoutRef<"input"> {
  as?: React.ElementType;
  small?: boolean;
  size?: "small" | "medium";
  indeterminate?: boolean;
  semanticColor?: string; // Default: "essentialBrightAccent"
  id?: string;
}

export interface FormInputProps extends React.ComponentPropsWithoutRef<"input"> {
  as?: React.ElementType;
  size?: "small" | "medium" | "large";
  error?: boolean; // Sets aria-invalid
}

export interface FormInputIconProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  iconLeading?: React.ReactElement;
  iconTrailing?: React.ReactElement;
  children: React.ReactNode; // Usually the FormInput
}

export interface FormTextareaProps extends React.ComponentPropsWithoutRef<"textarea"> {
  as?: React.ElementType;
  size?: "small" | "medium";
  error?: boolean; // Sets aria-invalid
}
export interface HorizontalRuleProps extends React.ComponentPropsWithoutRef<"hr"> {
  as?: React.ElementType;
}
export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  as?: React.ElementType;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge" | "xxxxlarge";
  iconSize?: number; // Manual pixel override (e.g. 24)
  semanticColor?: string; // Token like "textBase"
  autoMirror?: boolean; // Flip for RTL languages
  title?: string;
  desc?: string;
}
export interface ImageProps extends React.ComponentPropsWithoutRef<"img"> {
  as?: React.ElementType;
  placeholderSrc?: string; // Triggers lazy loading via IntersectionObserver
  placeholderIcon?: React.ElementType; // Icon to show while loading
  imageWidth?: string | number;
  imageHeight?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
  crop?: boolean; // Object-fit cover logic
  fluid?: boolean; // 100% width
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
}
export interface ListProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  orientation?: "row" | "column";
  hasDividers?: boolean;
  gap?: string | number; // Spacing token or raw value
}
export interface ListRowProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  id: string; // Used for aria-labelledby linking
  size?: "sm" | "md" | "lg" | "xl" | "xxl"; // Default: "lg"
  layout?: "regular" | "wide";

  // Content Slots
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  pretitle?: React.ReactNode;
  media?: string; // Image URL
  leading?: React.ReactNode; // Slot before text
  trailing?: React.ReactNode; // Slot after text
  body?: React.ReactNode;
  footer?: React.ReactNode;

  // Interaction
  onClick?: (e: React.MouseEvent) => void;
  onClickHint?: string;
  onClickRole?: string;
  isRedundantOnClick?: boolean;
  isSelected?: boolean;
  disabled?: boolean;

  // Spacing
  titleGap?: string;
  verticalGap?: string;
  horizontalGap?: string;
}
// for title subtitle details
export interface ListRowTextProps extends React.ComponentPropsWithoutRef<"p"> {
  as?: React.ElementType;
  variant?: string;
  weight?: string;
  lineClamp?: number;
  semanticColor?: string;
}
export interface ListRowImageProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  imageWidth?: string | number;
  imageHeight?: string | number;
  borderRadius?: string | number;
}
export interface LogoSpotifyProps extends React.ComponentPropsWithoutRef<"svg"> {
  as?: React.ElementType;
  /** If true, renders a compact version of the logo (0 0 24 24) */
  condensed?: boolean;
  /** Semantic color token. @default "decorativeBase" */
  semanticColor?: string;
  /** If true, forces the specific Spotify brand green color */
  useBrandColor?: boolean;
  /** Screen reader label. @default "Spotify" */
  label?: string;
}
export interface PopoverProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  /** Theme set. @default "base" */
  colorSet?: string;
  popoverTitle?: string;
  popoverTitleId?: string;
  onClose?: () => void;
  /** Increases the padding/size of the popover */
  large?: boolean;
  closeButtonAriaLabel?: string;
  /** Ref for the close button, useful for initial focus */
  closeButtonRef?: React.Ref<HTMLButtonElement>;
  /** Direction for the popover arrow */
  arrow?: "top" | "bottom" | "left" | "right";
}
export interface ProgressCircleProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
  /** Current value (0-100) */
  value?: number;
  /** @default "indeterminate" */
  variant?: "determinate" | "indeterminate";
  /** Size token. @default "medium" */
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
  /** Semantic color token. @default "textBase" */
  semanticColor?: string;
  /** Whether to show the background track circle. @default true */
  showTrack?: boolean;
  /** Ensures the fill is always visible even at 0%. @default true */
  hasMinimumFill?: boolean;
  /** Description of the current status for screen readers */
  valuetext?: string | ((value: number) => string);
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
export interface ProgressDotsProps extends React.ComponentPropsWithoutRef<"svg"> {
  as?: React.ElementType;
  size?: "small" | "medium" | "large";
  role?: string; // Default: "progressbar"
  ariaValueText?: string; // Default: "Loading"
}
export interface TextLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  as?: React.ElementType;
  href?: string;
  /** If provided, renders as the specified element. Default: "a" */
  component?: "a" | "button" | "span";
  /** Text variant. */
  variant?: string;
  /** Semantic color token. */
  semanticColor?: string;
  /** Use inherited color instead of default link colors. @default false */
  hasInheritColor?: boolean;
  /** Renders with underline/link styling even if not inside a text block. */
  standalone?: boolean;
  disabled?: boolean;
} /** Supports UI.Type.h1, UI.Type.p, etc. */
export interface TypeProps extends React.ComponentPropsWithoutRef<"span"> {
  as?: React.ElementType;
  /** Font weight. */
  weight?: string;
  /** Typography variant. @default "viola" */
  variant?: string;
  semanticColor?: string;
  paddingBottom?: string | number;
}
export interface TypeListProps extends React.ComponentPropsWithoutRef<"ul"> {
  as?: React.ElementType;
  /** Removes bullets and padding. @default false */
  listStyleReset?: boolean;
  /** Reduces vertical spacing between items. */
  condensed?: boolean;
  /** Reduces spacing globally. */
  condensedAll?: boolean;
  role?: string; // Default: "list"
}
export interface VisuallyHiddenProps extends React.ComponentPropsWithoutRef<"span"> {
  /** The element to render as. Default: "span" */
  as?: React.ElementType;
  /** Alias for 'as' */
  component?: React.ElementType;
}

import { fnStr } from "/hooks/util.ts";
import type { React } from "../expose/React.ts";
import type {
  AdaptiveTitleProps,
  BoxProps,
  ButtonPrimaryProps,
  ButtonSecondaryProps,
  ButtonTertiaryProps,
  CardDetailsProps,
  CardImageProps,
  CardProps,
  CardSubtitleProps,
  CardTitleProps,
  ChipProps,
  FormCheckboxProps,
  FormInputIconProps,
  FormInputProps,
  FormTextareaProps,
  HorizontalRuleProps,
  IconProps,
  ImageProps,
  ListProps,
  ListRowImageProps,
  ListRowProps,
  ListRowTextProps,
  LogoSpotifyProps,
  PopoverProps,
  ProgressCircleProps,
  ProgressDotsProps,
  TextLinkProps,
  TextProps,
  TypeListProps,
  TypeProps,
  VisuallyHiddenProps,
} from "./ComponentLibrary.types.tsx";
import {
  exportedForwardRefs,
  exportedFunctions,
  exportedMemoForwardRefs,
  exportedMemos,
} from "./index.ts";

await globalThis.CHUNKS.xpui.promise;

// instead of doing this
// instead do it manually as some components arent exported
// instead i would do data-encore-id=t.k.ChipGroup
// and then also add type for each
const componentPairs = [
  exportedFunctions.map((f) => [f, f]),
  exportedForwardRefs.map((f) => [(f as any).render, f]),
  exportedMemos.map((f) => [(f as any).type, f]),
  exportedMemoForwardRefs.map((f) => [(f as any).type?.render ?? (f as any).render, f]),
]
  .flat()
  .map(([s, f]) => {
    const match = fnStr(s)?.match(/"data-encore-id":\s*[\w$]+\.[\w$]+\.([\w$]+)/);
    return match?.[1] ? [match[1], f] : null;
  })
  .filter(Boolean);

export const UI: {
  AdaptiveTitle: React.ForwardRefExoticComponent<
    AdaptiveTitleProps & React.RefAttributes<HTMLElement>
  >;
  Text: React.ForwardRefExoticComponent<TextProps & React.RefAttributes<HTMLElement>>;
  Box: React.ForwardRefExoticComponent<BoxProps & React.RefAttributes<HTMLElement>>;
  ButtonPrimary: React.ForwardRefExoticComponent<
    ButtonPrimaryProps & React.RefAttributes<HTMLElement>
  >;
  ButtonSecondary: React.ForwardRefExoticComponent<
    ButtonSecondaryProps & React.RefAttributes<HTMLElement>
  >;
  ButtonTertiary: React.ForwardRefExoticComponent<
    ButtonTertiaryProps & React.RefAttributes<HTMLElement>
  >;
  Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLElement>>;
  CardTitle: React.ForwardRefExoticComponent<CardTitleProps & React.RefAttributes<HTMLElement>>;
  CardSubtitle: React.ForwardRefExoticComponent<
    CardSubtitleProps & React.RefAttributes<HTMLElement>
  >;
  CardDetails: React.ForwardRefExoticComponent<CardDetailsProps & React.RefAttributes<HTMLElement>>;
  CardImage: React.FC<CardImageProps>;
  Chip: React.ForwardRefExoticComponent<ChipProps & React.RefAttributes<HTMLElement>>;
  FormCheckbox: React.ForwardRefExoticComponent<
    FormCheckboxProps & React.RefAttributes<HTMLElement>
  >;
  FormInput: React.ForwardRefExoticComponent<FormInputProps & React.RefAttributes<HTMLElement>>;
  FormInputIcon: React.FC<FormInputIconProps>;
  FormTextarea: React.ForwardRefExoticComponent<
    FormTextareaProps & React.RefAttributes<HTMLElement>
  >;
  HorizontalRule: React.FC<HorizontalRuleProps>;
  Icon: React.FC<IconProps>;
  Image: React.FC<ImageProps>;
  List: React.ForwardRefExoticComponent<ListProps & React.RefAttributes<HTMLElement>>;
  ListRow: React.ForwardRefExoticComponent<ListRowProps & React.RefAttributes<HTMLElement>>;
  ListRowTitle: React.ForwardRefExoticComponent<
    ListRowTextProps & React.RefAttributes<HTMLElement>
  >;
  ListRowSubtitle: React.ForwardRefExoticComponent<
    ListRowTextProps & React.RefAttributes<HTMLElement>
  >;
  ListRowDetails: React.ForwardRefExoticComponent<
    ListRowTextProps & React.RefAttributes<HTMLElement>
  >;
  ListRowImage: React.FC<ListRowImageProps>;
  LogoSpotify: React.FC<LogoSpotifyProps>;
  Popover: React.ForwardRefExoticComponent<PopoverProps & React.RefAttributes<HTMLElement>>;
  ProgressCircle: React.ForwardRefExoticComponent<
    ProgressCircleProps & React.RefAttributes<HTMLElement>
  >;
  ProgressDots: React.ForwardRefExoticComponent<
    ProgressDotsProps & React.RefAttributes<HTMLElement>
  >;
  TextLink: React.ForwardRefExoticComponent<TextLinkProps & React.RefAttributes<HTMLElement>>;
  Type: React.ForwardRefExoticComponent<TypeProps & React.RefAttributes<HTMLElement>>;
  TypeList: React.ForwardRefExoticComponent<TypeListProps & React.RefAttributes<HTMLElement>>;
  VisuallyHidden: React.ForwardRefExoticComponent<
    VisuallyHiddenProps & React.RefAttributes<HTMLElement>
  >;
} = Object.fromEntries(componentPairs) as any;

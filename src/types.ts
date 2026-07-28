import type { ComponentRef, ReactNode, Ref } from "react";
import type {
  ColorValue,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

export type RatingDirection = "auto" | "ltr" | "rtl";
export type ResolvedRatingDirection = Exclude<RatingDirection, "auto">;
export type RatingOrientation = "horizontal" | "vertical";
export type RatingInteractionMode = "tap" | "tap-and-drag";
export type RatingInteractionSource = "accessibility" | "keyboard" | "pointer";
export type RatingFillOrigin = "bottom" | "left" | "right";
export type RatingScaleSelectionMode = "cumulative" | "single";
export type RatingScaleValue = number | string;

export interface RatingInteractionDetails {
  readonly source: RatingInteractionSource;
}

export interface RatingInteractionEndDetails extends RatingInteractionDetails {
  readonly cancelled: boolean;
}

export type RatingRootProps = Omit<
  ViewProps,
  | "accessible"
  | "accessibilityActions"
  | "accessibilityElementsHidden"
  | "accessibilityRole"
  | "accessibilityState"
  | "accessibilityValue"
  | "children"
  | "importantForAccessibility"
  | "focusable"
  | "onAccessibilityAction"
  | "onMoveShouldSetResponder"
  | "onMoveShouldSetResponderCapture"
  | "onKeyDown"
  | "onKeyDownCapture"
  | "onResponderEnd"
  | "onResponderGrant"
  | "onResponderMove"
  | "onResponderReject"
  | "onResponderRelease"
  | "onResponderStart"
  | "onResponderTerminate"
  | "onResponderTerminationRequest"
  | "onShouldBlockNativeResponder"
  | "onStartShouldSetResponder"
  | "onStartShouldSetResponderCapture"
  | "role"
  | "pointerEvents"
  | "tabIndex"
  | "aria-disabled"
  | "aria-hidden"
  | "aria-label"
  | "aria-orientation"
  | "aria-valuemax"
  | "aria-valuemin"
  | "aria-valuenow"
  | "aria-valuetext"
>;

export interface RatingVisualProps extends RatingRootProps {
  /**
   * Color of the selected portion.
   * @default "#B45309"
   */
  activeColor?: ColorValue;
  /**
   * Color of the unselected portion.
   * @default "#6B7280"
   */
  inactiveColor?: ColorValue;
  /**
   * Resolves item layout independently of the application locale when set.
   * @default "auto"
   */
  direction?: RatingDirection;
  /**
   * Space between visual items.
   * @default 0
   */
  gap?: number;
  /**
   * Lays items out horizontally or vertically.
   * @default "horizontal"
   */
  orientation?: RatingOrientation;
  /**
   * Size of each visible item. Interactive controls retain a 44pt/48dp
   * cross-axis target without widening every item.
   * @default 28
   */
  size?: number;
  /**
   * React 19 ref for the root native View.
   */
  ref?: Ref<ComponentRef<typeof View>>;
}

export interface RatingRenderItemProps {
  activeColor: ColorValue;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  fill: number;
  fillOrigin: RatingFillOrigin;
  inactiveColor: ColorValue;
  index: number;
  orientation: RatingOrientation;
  pressed: boolean;
  size: number;
  value: number;
}

export type RatingRenderItem = (props: RatingRenderItemProps) => ReactNode;

export interface RatingProps extends RatingVisualProps {
  /**
   * Lets a parent own the current rating. Pair it with `onChange`.
   */
  value?: number;
  /**
   * Initial value when the component is uncontrolled.
   */
  defaultValue?: number;
  /**
   * Smallest selectable nonzero rating. Zero remains the unrated sentinel.
   * @default 0
   */
  min?: number;
  /**
   * Number of rating items. Values outside 1–100 are clamped.
   * @default 5
   */
  max?: number;
  /**
   * Per-item selection precision. Values outside 0.01–1 are clamped.
   * @default 1
   */
  step?: number;
  /**
   * Called for each distinct value selected by the user. Drag interactions can
   * call this more than once; keep expensive persistence in `onChangeEnd`.
   */
  onChange?: (value: number) => void;
  /**
   * Called once when an interaction is accepted. A tap is accepted on release;
   * a drag is accepted after it crosses the primary-axis movement threshold.
   */
  onInteractionStart?: (
    value: number,
    details: RatingInteractionDetails
  ) => void;
  /**
   * Called once after an accepted interaction. A terminated drag reports
   * `cancelled: true`.
   */
  onChangeEnd?: (value: number, details: RatingInteractionEndDetails) => void;
  /**
   * Clears the rating on a true same-value tap or decrement at the minimum.
   * @default false
   */
  allowClear?: boolean;
  /**
   * Prevents interaction and exposes a disabled accessibility state.
   * @default false
   */
  disabled?: boolean;
  /**
   * Presents the rating through the static, allocation-light display path.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Enables axis-aware drag input without requiring a gesture dependency.
   * Tap remains available in both modes.
   * @default "tap"
   */
  interactionMode?: RatingInteractionMode;
  /**
   * Enables quiet completion feedback. System reduced-motion settings win.
   * @default true
   */
  animated?: boolean;
  /**
   * Overrides the default two-color Web focus indicator while focused.
   */
  focusStyle?: StyleProp<ViewStyle>;
  /**
   * Formats the text announced with the accessibility value.
   */
  formatAccessibilityValue?: (value: number, max: number) => string;
  /**
   * Replaces the default text star without adding an icon or SVG dependency.
   * The returned subtree is visual-only; use the root accessibility props for
   * semantics.
   */
  renderItem?: RatingRenderItem;
}

export interface RatingDisplayProps extends RatingVisualProps {
  /**
   * Value to display. It is clamped to zero through `max`.
   */
  value: number;
  /**
   * Visually dims the display and forwards disabled state to custom items.
   * @default false
   */
  disabled?: boolean;
  /**
   * Hides the display from assistive technology when adjacent text already
   * communicates the same value.
   * @default false
   */
  decorative?: boolean;
  /**
   * Number of rating items. Values outside 1–100 are clamped.
   * @default 5
   */
  max?: number;
  /**
   * Optional display snapping. Omit it to render an exact aggregate such as
   * 4.37.
   */
  step?: number;
  /**
   * Formats the accessible value text.
   */
  formatAccessibilityValue?: (value: number, max: number) => string;
  /**
   * Replaces the default visual item.
   */
  renderItem?: RatingRenderItem;
}

export interface RatingScaleItem<
  Value extends RatingScaleValue = RatingScaleValue,
> {
  /**
   * Stable semantic value. Zero and negative numbers are valid.
   */
  value: Value;
  /**
   * Human-readable meaning announced by assistive technology.
   */
  label: string;
  /**
   * Optional default visual content, commonly an emoji or icon.
   */
  content?: ReactNode;
}

export interface RatingScaleRenderItemProps<
  Value extends RatingScaleValue = RatingScaleValue,
> {
  activeColor: ColorValue;
  content: ReactNode | undefined;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  inactiveColor: ColorValue;
  index: number;
  itemExtent: number;
  label: string;
  orientation: RatingOrientation;
  pressed: boolean;
  selected: boolean;
  size: number;
  value: Value;
}

export type RatingScaleRenderItem<
  Value extends RatingScaleValue = RatingScaleValue,
> = (props: RatingScaleRenderItemProps<Value>) => ReactNode;

export interface RatingScaleProps<
  Value extends RatingScaleValue = RatingScaleValue,
> extends RatingVisualProps {
  /**
   * Ordered semantic choices. The first 100 valid items are rendered.
   */
  items: readonly RatingScaleItem<Value>[];
  /**
   * Controlled semantic value. `null` means no selection.
   */
  value?: Value | null;
  /**
   * Initial uncontrolled semantic value.
   */
  defaultValue?: Value | null;
  /**
   * Called for each distinct semantic value selected by the user.
   */
  onChange?: (value: Value | null) => void;
  /**
   * Called once when an interaction is accepted. A tap is accepted on release;
   * a drag is accepted after it crosses the primary-axis movement threshold.
   */
  onInteractionStart?: (
    value: Value | null,
    details: RatingInteractionDetails
  ) => void;
  /**
   * Called once after an accepted interaction.
   */
  onChangeEnd?: (
    value: Value | null,
    details: RatingInteractionEndDetails
  ) => void;
  /**
   * Allows a same-value tap or decrement at the first item to select `null`.
   * @default false
   */
  allowClear?: boolean;
  /**
   * Prevents interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Uses a static path with no responder, animation, or motion subscription.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Hides a read-only scale from assistive technology when adjacent content
   * already communicates the same value. Ignored for interactive scales.
   * @default false
   */
  decorative?: boolean;
  /**
   * Enables axis-aware drag input.
   * @default "tap"
   */
  interactionMode?: RatingInteractionMode;
  /**
   * Reverses semantic item progression independently of locale direction.
   * @default false
   */
  reversed?: boolean;
  /**
   * Primary-axis length of each semantic choice. Increase it for text labels
   * without inflating the cross-axis target or renderer `size`.
   * @default size
   */
  itemExtent?: number;
  /**
   * Selects only the chosen item or every item through it.
   * @default "single"
   */
  selectionMode?: RatingScaleSelectionMode;
  /**
   * Enables quiet completion feedback.
   * @default true
   */
  animated?: boolean;
  /**
   * Overrides the default two-color Web focus indicator while focused.
   */
  focusStyle?: StyleProp<ViewStyle>;
  /**
   * Formats the announced semantic value.
   */
  formatAccessibilityValue?: (item: RatingScaleItem<Value> | null) => string;
  /**
   * Renders a semantic visual item.
   */
  renderItem?: RatingScaleRenderItem<Value>;
}

import { useCallback, useState } from "react";
import type { ComponentRef, ReactNode, Ref } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type {
  AccessibilityActionEvent,
  FocusEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from "react-native";

import type {
  RatingOrientation,
  RatingRootProps,
  ResolvedRatingDirection,
} from "../types";
import { getForwardedRatingRootProps } from "./root-props";

const ACCESSIBILITY_ACTIONS = [
  { name: "increment" as const },
  { name: "decrement" as const },
];

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  webFocus: {
    borderRadius: 2,
    boxShadow: "0 0 0 4px #FFFFFF",
    outlineColor: "#1D4ED8",
    outlineOffset: 2,
    outlineStyle: "solid",
    outlineWidth: 2,
  },
});

interface RatingKeyboardEvent {
  altKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  key?: string | undefined;
  metaKey?: boolean | undefined;
  nativeEvent?:
    | {
        altKey?: boolean | undefined;
        ctrlKey?: boolean | undefined;
        key?: string | undefined;
        metaKey?: boolean | undefined;
      }
    | undefined;
  preventDefault?: (() => void) | undefined;
  stopPropagation?: (() => void) | undefined;
}

interface WebSliderProps {
  "aria-orientation": RatingOrientation;
  "aria-valuemax": number;
  "aria-valuemin": number;
  "aria-valuenow": number;
  "aria-valuetext": string;
  onKeyDown?: (event: RatingKeyboardEvent) => void;
  role: "slider";
  tabIndex: -1 | 0;
}

interface InteractiveRootProps {
  accessibilityLabel: string;
  accessibilityText: string;
  children: ReactNode;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  focusStyle: StyleProp<ViewStyle> | undefined;
  nativeMax: number;
  nativeMin: number;
  nativeNow: number;
  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
  onKeyDown: (event: RatingKeyboardEvent) => void;
  orientation: RatingOrientation;
  ref: Ref<ComponentRef<typeof View>> | undefined;
  rootProps: RatingRootProps;
  webMax: number;
  webMin: number;
  webNow: number;
}

const getWebSliderProps = ({
  accessibilityText,
  disabled,
  onKeyDown,
  orientation,
  webMax,
  webMin,
  webNow,
}: Pick<
  InteractiveRootProps,
  | "accessibilityText"
  | "disabled"
  | "onKeyDown"
  | "orientation"
  | "webMax"
  | "webMin"
  | "webNow"
>): WebSliderProps | undefined =>
  Platform.OS === "web"
    ? {
        "aria-orientation": orientation,
        "aria-valuemax": webMax,
        "aria-valuemin": webMin,
        "aria-valuenow": webNow,
        "aria-valuetext": accessibilityText,
        ...(disabled ? {} : { onKeyDown }),
        role: "slider",
        tabIndex: disabled ? -1 : 0,
      }
    : undefined;

export const InteractiveRoot = ({
  accessibilityLabel,
  accessibilityText,
  children,
  direction,
  disabled,
  focusStyle,
  nativeMax,
  nativeMin,
  nativeNow,
  onAccessibilityAction,
  onKeyDown,
  orientation,
  ref,
  rootProps,
  webMax,
  webMin,
  webNow,
}: InteractiveRootProps) => {
  const { onBlur, onFocus, style, testID, ...viewProps } =
    getForwardedRatingRootProps(rootProps);
  const [focused, setFocused] = useState(false);
  const handleFocus = useCallback(
    (event: FocusEvent): void => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus]
  );
  const handleBlur = useCallback(
    (event: FocusEvent): void => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur]
  );
  const webSliderProps = getWebSliderProps({
    accessibilityText,
    disabled,
    onKeyDown,
    orientation,
    webMax,
    webMin,
    webNow,
  });

  return (
    <View
      {...viewProps}
      {...(webSliderProps as ViewProps | undefined)}
      accessibilityActions={disabled ? undefined : ACCESSIBILITY_ACTIONS}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={
        Platform.OS === "web"
          ? undefined
          : {
              max: nativeMax,
              min: nativeMin,
              now: nativeNow,
              text: accessibilityText,
            }
      }
      accessible
      aria-disabled={disabled}
      aria-label={accessibilityLabel}
      onAccessibilityAction={disabled ? undefined : onAccessibilityAction}
      onBlur={handleBlur}
      onFocus={handleFocus}
      ref={ref ?? null}
      style={[
        styles.root,
        disabled ? { opacity: 0.45 } : undefined,
        style,
        Platform.OS === "web" && focused ? styles.webFocus : undefined,
        Platform.OS === "web" && focused ? focusStyle : undefined,
        { direction },
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

import type { RatingRootProps } from "../types";

const OWNED_ROOT_PROPS = new Set<string>([
  "accessible",
  "accessibilityActions",
  "accessibilityElementsHidden",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityValue",
  "aria-disabled",
  "aria-hidden",
  "aria-label",
  "aria-orientation",
  "aria-valuemax",
  "aria-valuemin",
  "aria-valuenow",
  "aria-valuetext",
  "children",
  "focusable",
  "importantForAccessibility",
  "onAccessibilityAction",
  "onKeyDown",
  "onKeyDownCapture",
  "onMoveShouldSetResponder",
  "onMoveShouldSetResponderCapture",
  "onResponderEnd",
  "onResponderGrant",
  "onResponderMove",
  "onResponderReject",
  "onResponderRelease",
  "onResponderStart",
  "onResponderTerminate",
  "onResponderTerminationRequest",
  "onShouldBlockNativeResponder",
  "onStartShouldSetResponder",
  "onStartShouldSetResponderCapture",
  "pointerEvents",
  "role",
  "tabIndex",
]);

const hasOwnProperty = (value: object, name: PropertyKey): boolean =>
  Object.getOwnPropertyDescriptor(value, name) !== undefined;

export const getForwardedRatingRootProps = (
  rootProps: RatingRootProps
): RatingRootProps => {
  let hasOwnedProp = false;

  for (const name in rootProps) {
    if (hasOwnProperty(rootProps, name) && OWNED_ROOT_PROPS.has(name)) {
      hasOwnedProp = true;
      break;
    }
  }

  if (!hasOwnedProp) {
    return rootProps;
  }

  const entries = Object.entries(rootProps).filter(
    ([name]) => !OWNED_ROOT_PROPS.has(name)
  );

  return Object.fromEntries(entries);
};

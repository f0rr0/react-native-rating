import { I18nManager, Platform, StyleSheet, View } from "react-native";

import {
  createNumericModel,
  DEFAULT_MAX,
  DEFAULT_SIZE,
  normalizeDisplayValue,
  normalizeGap,
  normalizeMax,
  normalizePositive,
  resolveDirection,
} from "./internal/model";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  NumericRatingItems,
  RatingTrackFrame,
} from "./internal/rating-track";
import { getForwardedRatingRootProps } from "./internal/root-props";
import type { RatingDisplayProps } from "./types";

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
});

export const defaultFormatAccessibilityValue = (
  value: number,
  max: number
): string => `${value} out of ${max}`;

export const RatingDisplay = ({
  accessibilityLabel = "Rating",
  activeColor = DEFAULT_ACTIVE_COLOR,
  decorative = false,
  direction = "auto",
  disabled = false,
  formatAccessibilityValue = defaultFormatAccessibilityValue,
  gap = 0,
  inactiveColor = DEFAULT_INACTIVE_COLOR,
  max = DEFAULT_MAX,
  orientation = "horizontal",
  ref,
  renderItem,
  size = DEFAULT_SIZE,
  step,
  style,
  testID,
  value,
  ...viewProps
}: RatingDisplayProps) => {
  const forwardedViewProps = getForwardedRatingRootProps(viewProps);
  const safeMax = normalizeMax(max);
  const safeSize = normalizePositive(size, DEFAULT_SIZE);
  const safeGap = normalizeGap(gap);
  const safeValue = normalizeDisplayValue(value, safeMax, step);
  const resolvedDirection = resolveDirection(direction, I18nManager.isRTL);
  const valueText = formatAccessibilityValue(safeValue, safeMax);
  const model = createNumericModel(safeMax, 0, step ?? 1);
  const resolvedAccessibilityLabel =
    Platform.OS === "web"
      ? `${accessibilityLabel}, ${valueText}`
      : accessibilityLabel;

  return (
    <View
      {...forwardedViewProps}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : resolvedAccessibilityLabel}
      accessibilityRole={decorative ? undefined : "image"}
      accessibilityState={decorative ? undefined : { disabled }}
      accessibilityValue={
        decorative || Platform.OS === "web" ? undefined : { text: valueText }
      }
      accessible={!decorative}
      aria-disabled={decorative ? undefined : disabled}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : resolvedAccessibilityLabel}
      importantForAccessibility={decorative ? "no-hide-descendants" : undefined}
      ref={ref ?? null}
      style={[
        styles.root,
        disabled ? { opacity: 0.45 } : undefined,
        style,
        { direction: resolvedDirection },
      ]}
      testID={testID}
    >
      <RatingTrackFrame
        direction={resolvedDirection}
        gap={safeGap}
        interactive={false}
        itemCount={safeMax}
        itemSize={safeSize}
        orientation={orientation}
        targetSize={safeSize}
        testID={testID}
      >
        <NumericRatingItems
          activeColor={activeColor}
          direction={resolvedDirection}
          disabled={disabled}
          inactiveColor={inactiveColor}
          itemSize={safeSize}
          model={model}
          orientation={orientation}
          pressedTick={null}
          pulseIndex={null}
          pulseScale={null}
          renderItem={renderItem}
          targetSize={safeSize}
          testID={testID}
          value={safeValue}
        />
      </RatingTrackFrame>
    </View>
  );
};

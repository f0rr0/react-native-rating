import { useCallback, useMemo, useState } from "react";
import { I18nManager, Platform, StyleSheet, View } from "react-native";
import type { ColorValue } from "react-native";

import { InteractiveRoot } from "./internal/interactive-root";
import {
  DEFAULT_SIZE,
  getScaleTickFromPosition,
  getTrackExtent,
  isRatingScaleValue,
  MAX_ITEMS,
  normalizeGap,
  normalizePositive,
  resolveDirection,
} from "./internal/model";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  RatingTrackFrame,
  ScaleRatingItems,
} from "./internal/rating-track";
import { useReducedMotion } from "./internal/reduced-motion";
import { getForwardedRatingRootProps } from "./internal/root-props";
import { useRatingInteraction } from "./internal/use-rating-interaction";
import { useSelectionPulse } from "./internal/use-selection-pulse";
import type {
  RatingDirection,
  RatingInteractionEndDetails,
  RatingInteractionMode,
  RatingInteractionSource,
  RatingOrientation,
  RatingRootProps,
  RatingScaleItem,
  RatingScaleProps,
  RatingScaleRenderItem,
  RatingScaleSelectionMode,
  RatingScaleValue,
} from "./types";

const PRESS_TARGET_SIZE = Platform.select({ default: 48, ios: 44 });

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
});

const defaultFormatAccessibilityValue = <Value extends RatingScaleValue>(
  item: RatingScaleItem<Value> | null
): string => item?.label ?? "No selection";

const normalizeItems = <Value extends RatingScaleValue>(
  items: readonly RatingScaleItem<Value>[]
): readonly RatingScaleItem<Value>[] => {
  const result: RatingScaleItem<Value>[] = [];
  const seenValues = new Set<RatingScaleValue>();

  for (const item of items) {
    if (result.length >= MAX_ITEMS) {
      break;
    }

    if (
      !isRatingScaleValue(item?.value) ||
      typeof item.label !== "string" ||
      item.label.trim().length === 0 ||
      seenValues.has(item.value)
    ) {
      continue;
    }

    seenValues.add(item.value);
    result.push(item);
  }

  return result;
};

const getScaleTick = <Value extends RatingScaleValue>(
  value: Value | null,
  items: readonly RatingScaleItem<Value>[],
  reversed: boolean
): number => {
  if (value === null) {
    return 0;
  }

  const index = items.findIndex((item) => item.value === value);

  if (index === -1) {
    return 0;
  }

  return reversed ? items.length - index : index + 1;
};

const getScaleItem = <Value extends RatingScaleValue>(
  tick: number,
  items: readonly RatingScaleItem<Value>[],
  reversed: boolean
): RatingScaleItem<Value> | null => {
  const index = reversed ? items.length - tick : tick - 1;

  return items[index] ?? null;
};

const getScaleValue = <Value extends RatingScaleValue>(
  tick: number,
  items: readonly RatingScaleItem<Value>[],
  reversed: boolean
): Value | null => getScaleItem(tick, items, reversed)?.value ?? null;

interface ScaleDisplayProps<Value extends RatingScaleValue> {
  accessibilityLabel: string;
  activeColor: ColorValue;
  decorative: boolean;
  direction: RatingDirection;
  disabled: boolean;
  formatAccessibilityValue: (item: RatingScaleItem<Value> | null) => string;
  gap: number;
  inactiveColor: ColorValue;
  itemExtent: number;
  items: readonly RatingScaleItem<Value>[];
  orientation: RatingOrientation;
  ref: RatingScaleProps<Value>["ref"];
  renderItem: RatingScaleRenderItem<Value> | undefined;
  reversed: boolean;
  rootProps: RatingRootProps;
  selectedTick: number;
  selectionMode: RatingScaleSelectionMode;
  size: number;
}

interface InteractiveScaleProps<
  Value extends RatingScaleValue,
> extends ScaleDisplayProps<Value> {
  allowClear: boolean;
  animated: boolean;
  focusStyle: RatingScaleProps<Value>["focusStyle"];
  interactionMode: RatingInteractionMode;
  onChangeEnd:
    | ((value: Value | null, details: RatingInteractionEndDetails) => void)
    | undefined;
  onChangeTick: (tick: number) => void;
  onInteractionStart: RatingScaleProps<Value>["onInteractionStart"];
}

const ScaleDisplay = <Value extends RatingScaleValue>({
  accessibilityLabel,
  activeColor,
  decorative,
  direction,
  disabled,
  formatAccessibilityValue,
  gap,
  inactiveColor,
  itemExtent,
  items,
  orientation,
  ref,
  renderItem,
  reversed,
  rootProps,
  selectedTick,
  selectionMode,
  size,
}: ScaleDisplayProps<Value>) => {
  const { style, testID, ...viewProps } = rootProps;
  const forwardedViewProps = getForwardedRatingRootProps(viewProps);
  const resolvedDirection = resolveDirection(direction, I18nManager.isRTL);
  const selectedItem = getScaleItem(selectedTick, items, reversed);
  const valueText = formatAccessibilityValue(selectedItem);
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
        gap={gap}
        interactive={false}
        itemCount={items.length}
        itemSize={itemExtent}
        orientation={orientation}
        targetSize={size}
        testID={testID}
      >
        <ScaleRatingItems
          activeColor={activeColor}
          direction={resolvedDirection}
          disabled={disabled}
          inactiveColor={inactiveColor}
          itemExtent={itemExtent}
          itemSize={size}
          items={items}
          orientation={orientation}
          pressedTick={null}
          pulseIndex={null}
          pulseScale={null}
          renderItem={renderItem}
          reversed={reversed}
          selectedTick={selectedTick}
          selectionMode={selectionMode}
          targetSize={size}
          testID={testID}
        />
      </RatingTrackFrame>
    </View>
  );
};

const InteractiveScale = <Value extends RatingScaleValue>({
  accessibilityLabel,
  activeColor,
  allowClear,
  animated,
  direction,
  disabled,
  formatAccessibilityValue,
  focusStyle,
  gap,
  inactiveColor,
  interactionMode,
  itemExtent,
  items,
  onChangeEnd,
  onChangeTick,
  onInteractionStart,
  orientation,
  ref,
  renderItem,
  reversed,
  rootProps,
  selectedTick,
  selectionMode,
  size,
}: InteractiveScaleProps<Value>) => {
  const { testID } = rootProps;
  const resolvedDirection = resolveDirection(direction, I18nManager.isRTL);
  const targetSize = Math.max(size, PRESS_TARGET_SIZE);
  const defaultExtent = getTrackExtent(items.length, itemExtent, gap);
  const reduceMotion = useReducedMotion(animated && !disabled);
  const getValue = useCallback(
    (tick: number): Value | null => getScaleValue(tick, items, reversed),
    [items, reversed]
  );
  const getPulseIndex = useCallback(
    (tick: number): number => (reversed ? items.length - tick : tick - 1),
    [items.length, reversed]
  );
  const pulseMappingKey = useMemo(
    () =>
      JSON.stringify(
        items.map(({ value: itemValue }) => [typeof itemValue, itemValue])
      ),
    [items]
  );
  const { pulse, pulseIndex, scale } = useSelectionPulse({
    enabled: animated && !disabled,
    getItemIndex: getPulseIndex,
    mappingKey: `${reversed}:${pulseMappingKey}`,
    reduceMotion,
  });
  const positionToTick = useCallback(
    (position: number, extent: number): number =>
      getScaleTickFromPosition(position, {
        direction: resolvedDirection,
        extent,
        gap,
        itemCount: items.length,
        itemSize: itemExtent,
        orientation,
      }),
    [gap, itemExtent, items.length, orientation, resolvedDirection]
  );
  const interactionStructure = useMemo(
    () => [
      allowClear,
      gap,
      interactionMode,
      itemExtent,
      orientation,
      resolvedDirection,
      reversed,
      size,
      ...items.map((item) => item.value),
    ],
    [
      allowClear,
      gap,
      interactionMode,
      itemExtent,
      items,
      orientation,
      resolvedDirection,
      reversed,
      size,
    ]
  );
  const handleComplete = useCallback(
    (tick: number, _source: RatingInteractionSource): void => {
      pulse(tick);
    },
    [pulse]
  );
  const interaction = useRatingInteraction({
    allowClear,
    currentTick: selectedTick,
    defaultExtent,
    disabled,
    getValue,
    interactionMode,
    maxTick: items.length,
    minTick: 1,
    onChangeEnd,
    onChangeTick,
    onComplete: handleComplete,
    onInteractionStart,
    orientation,
    positionToTick,
    structure: interactionStructure,
  });
  const displayTick = interaction.draftTick ?? selectedTick;
  const effectiveMinTick = allowClear || displayTick === 0 ? 0 : 1;
  const selectedItem = getScaleItem(displayTick, items, reversed);
  const accessibilityText = formatAccessibilityValue(selectedItem);

  return (
    <InteractiveRoot
      accessibilityLabel={accessibilityLabel}
      accessibilityText={accessibilityText}
      direction={resolvedDirection}
      disabled={disabled}
      focusStyle={focusStyle}
      nativeMax={items.length}
      nativeMin={effectiveMinTick}
      nativeNow={displayTick}
      onAccessibilityAction={interaction.handleAccessibilityAction}
      onKeyDown={interaction.handleKeyDown}
      orientation={orientation}
      ref={ref ?? null}
      rootProps={rootProps}
      webMax={items.length}
      webMin={effectiveMinTick}
      webNow={displayTick}
    >
      <RatingTrackFrame
        direction={resolvedDirection}
        gap={gap}
        handlers={interaction.trackHandlers}
        interactionMode={interactionMode}
        interactive={!disabled}
        itemCount={items.length}
        itemSize={itemExtent}
        orientation={orientation}
        targetSize={targetSize}
        testID={testID}
      >
        <ScaleRatingItems
          activeColor={activeColor}
          direction={resolvedDirection}
          disabled={disabled}
          inactiveColor={inactiveColor}
          itemExtent={itemExtent}
          itemSize={size}
          items={items}
          orientation={orientation}
          pressedTick={interaction.active ? displayTick : null}
          pulseIndex={interaction.dragging ? null : pulseIndex}
          pulseScale={scale}
          renderItem={renderItem}
          reversed={reversed}
          selectedTick={displayTick}
          selectionMode={selectionMode}
          targetSize={targetSize}
          testID={testID}
        />
      </RatingTrackFrame>
    </InteractiveRoot>
  );
};

export const RatingScale = <Value extends RatingScaleValue>({
  accessibilityLabel = "Rating scale",
  activeColor = DEFAULT_ACTIVE_COLOR,
  allowClear = false,
  animated = true,
  defaultValue = null,
  decorative = false,
  direction = "auto",
  disabled = false,
  formatAccessibilityValue = defaultFormatAccessibilityValue,
  focusStyle,
  gap = 0,
  inactiveColor = DEFAULT_INACTIVE_COLOR,
  interactionMode = "tap",
  itemExtent,
  items,
  onChange,
  onChangeEnd,
  onInteractionStart,
  orientation = "horizontal",
  readOnly = false,
  ref,
  renderItem,
  reversed = false,
  selectionMode = "single",
  size = DEFAULT_SIZE,
  value,
  ...rootProps
}: RatingScaleProps<Value>) => {
  const safeItems = useMemo(() => normalizeItems(items), [items]);
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<Value | null>(() =>
    getScaleValue(
      getScaleTick(defaultValue, safeItems, reversed),
      safeItems,
      reversed
    )
  );
  const normalizedUncontrolledValue = getScaleValue(
    getScaleTick(uncontrolledValue, safeItems, reversed),
    safeItems,
    reversed
  );

  if (!Object.is(uncontrolledValue, normalizedUncontrolledValue)) {
    setUncontrolledValue(normalizedUncontrolledValue);
  }

  const selectedTick = getScaleTick(
    controlled ? value : normalizedUncontrolledValue,
    safeItems,
    reversed
  );
  const safeSize = normalizePositive(size, DEFAULT_SIZE);
  const normalizedItemExtent = normalizePositive(
    itemExtent ?? safeSize,
    safeSize
  );
  const safeItemExtent =
    normalizedItemExtent < safeSize ? safeSize : normalizedItemExtent;
  const safeGap = normalizeGap(gap);

  const handleTickChange = useCallback(
    (tick: number): void => {
      const nextValue = getScaleValue(tick, safeItems, reversed);

      if (!controlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [controlled, onChange, reversed, safeItems]
  );

  const displayProps: ScaleDisplayProps<Value> = {
    accessibilityLabel,
    activeColor,
    decorative,
    direction,
    disabled,
    formatAccessibilityValue,
    gap: safeGap,
    inactiveColor,
    itemExtent: safeItemExtent,
    items: safeItems,
    orientation,
    ref,
    renderItem,
    reversed,
    rootProps,
    selectedTick,
    selectionMode,
    size: safeSize,
  };

  if (readOnly || safeItems.length === 0) {
    return <ScaleDisplay {...displayProps} />;
  }

  return (
    <InteractiveScale
      {...displayProps}
      allowClear={allowClear}
      animated={animated}
      focusStyle={focusStyle}
      interactionMode={interactionMode}
      onChangeEnd={onChangeEnd}
      onChangeTick={handleTickChange}
      onInteractionStart={onInteractionStart}
    />
  );
};

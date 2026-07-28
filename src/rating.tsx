import { useCallback, useMemo, useState } from "react";
import { I18nManager, Platform } from "react-native";
import type { ColorValue } from "react-native";

import { InteractiveRoot } from "./internal/interactive-root";
import {
  createNumericModel,
  DEFAULT_MAX,
  DEFAULT_SIZE,
  getNumericTickFromPosition,
  getTickItemIndex,
  getTrackExtent,
  getValueFromTick,
  normalizeGap,
  normalizeNumericTick,
  normalizeNumericValue,
  normalizePositive,
  resolveDirection,
} from "./internal/model";
import type { NumericRatingModel } from "./internal/model";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  NumericRatingItems,
  RatingTrackFrame,
} from "./internal/rating-track";
import { useReducedMotion } from "./internal/reduced-motion";
import { useRatingInteraction } from "./internal/use-rating-interaction";
import { useSelectionPulse } from "./internal/use-selection-pulse";
import {
  defaultFormatAccessibilityValue,
  RatingDisplay,
} from "./rating-display";
import type {
  RatingDirection,
  RatingInteractionEndDetails,
  RatingInteractionMode,
  RatingInteractionSource,
  RatingOrientation,
  RatingProps,
  RatingRenderItem,
  RatingRootProps,
} from "./types";

const PRESS_TARGET_SIZE = Platform.select({ default: 48, ios: 44 });

interface InteractiveNumericRatingProps {
  accessibilityLabel: string;
  activeColor: ColorValue;
  allowClear: boolean;
  animated: boolean;
  currentTick: number;
  direction: RatingDirection;
  disabled: boolean;
  focusStyle: RatingProps["focusStyle"];
  formatAccessibilityValue: (value: number, max: number) => string;
  gap: number;
  inactiveColor: ColorValue;
  interactionMode: RatingInteractionMode;
  model: NumericRatingModel;
  onChangeEnd:
    | ((value: number, details: RatingInteractionEndDetails) => void)
    | undefined;
  onChangeTick: (tick: number) => void;
  onInteractionStart: RatingProps["onInteractionStart"];
  orientation: RatingOrientation;
  ref: RatingProps["ref"];
  renderItem: RatingRenderItem | undefined;
  rootProps: RatingRootProps;
  size: number;
}

const InteractiveNumericRating = ({
  accessibilityLabel,
  activeColor,
  allowClear,
  animated,
  currentTick,
  direction,
  disabled,
  focusStyle,
  formatAccessibilityValue,
  gap,
  inactiveColor,
  interactionMode,
  model,
  onChangeEnd,
  onChangeTick,
  onInteractionStart,
  orientation,
  ref,
  renderItem,
  rootProps,
  size,
}: InteractiveNumericRatingProps) => {
  const { testID } = rootProps;
  const resolvedDirection = resolveDirection(direction, I18nManager.isRTL);
  const targetSize = Math.max(size, PRESS_TARGET_SIZE);
  const defaultExtent = getTrackExtent(model.max, size, gap);
  const reduceMotion = useReducedMotion(animated && !disabled);
  const getValue = useCallback(
    (tick: number): number => getValueFromTick(tick, model),
    [model]
  );
  const getPulseIndex = useCallback(
    (tick: number): number => getTickItemIndex(tick, model.ticksPerItem),
    [model.ticksPerItem]
  );
  const { pulse, pulseIndex, scale } = useSelectionPulse({
    enabled: animated && !disabled,
    getItemIndex: getPulseIndex,
    mappingKey: `${model.max}:${model.ticksPerItem}`,
    reduceMotion,
  });
  const positionToTick = useCallback(
    (position: number, extent: number): number =>
      getNumericTickFromPosition(
        position,
        {
          direction: resolvedDirection,
          extent,
          gap,
          itemCount: model.max,
          itemSize: size,
          orientation,
        },
        model
      ),
    [gap, model, orientation, resolvedDirection, size]
  );
  const interactionStructure = useMemo(
    () => [
      allowClear,
      gap,
      interactionMode,
      model.max,
      model.minTick,
      model.step,
      model.ticksPerItem,
      orientation,
      resolvedDirection,
      size,
    ],
    [
      allowClear,
      gap,
      interactionMode,
      model,
      orientation,
      resolvedDirection,
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
    currentTick,
    defaultExtent,
    disabled,
    getValue,
    interactionMode,
    maxTick: model.maxTick,
    minTick: model.minTick,
    onChangeEnd,
    onChangeTick,
    onComplete: handleComplete,
    onInteractionStart,
    orientation,
    positionToTick,
    structure: interactionStructure,
  });
  const displayTick = interaction.draftTick ?? currentTick;
  const displayValue = getValue(displayTick);
  const effectiveMinTick = allowClear || displayTick === 0 ? 0 : model.minTick;
  const accessibilityText = formatAccessibilityValue(displayValue, model.max);

  return (
    <InteractiveRoot
      accessibilityLabel={accessibilityLabel}
      accessibilityText={accessibilityText}
      direction={resolvedDirection}
      disabled={disabled}
      focusStyle={focusStyle}
      nativeMax={model.maxTick}
      nativeMin={effectiveMinTick}
      nativeNow={displayTick}
      onAccessibilityAction={interaction.handleAccessibilityAction}
      onKeyDown={interaction.handleKeyDown}
      orientation={orientation}
      ref={ref ?? null}
      rootProps={rootProps}
      webMax={model.max}
      webMin={getValue(effectiveMinTick)}
      webNow={displayValue}
    >
      <RatingTrackFrame
        direction={resolvedDirection}
        gap={gap}
        handlers={interaction.trackHandlers}
        interactionMode={interactionMode}
        interactive={!disabled}
        itemCount={model.max}
        itemSize={size}
        orientation={orientation}
        targetSize={targetSize}
        testID={testID}
      >
        <NumericRatingItems
          activeColor={activeColor}
          direction={resolvedDirection}
          disabled={disabled}
          inactiveColor={inactiveColor}
          itemSize={size}
          model={model}
          orientation={orientation}
          pressedTick={interaction.active ? displayTick : null}
          pulseIndex={interaction.dragging ? null : pulseIndex}
          pulseScale={scale}
          renderItem={renderItem}
          targetSize={targetSize}
          testID={testID}
          value={displayValue}
        />
      </RatingTrackFrame>
    </InteractiveRoot>
  );
};

export const Rating = ({
  accessibilityLabel = "Rating",
  activeColor = DEFAULT_ACTIVE_COLOR,
  allowClear = false,
  animated = true,
  defaultValue = 0,
  direction = "auto",
  disabled = false,
  focusStyle,
  formatAccessibilityValue = defaultFormatAccessibilityValue,
  gap = 0,
  inactiveColor = DEFAULT_INACTIVE_COLOR,
  interactionMode = "tap",
  max = DEFAULT_MAX,
  min = 0,
  onChange,
  onChangeEnd,
  onInteractionStart,
  orientation = "horizontal",
  readOnly = false,
  ref,
  renderItem,
  size = DEFAULT_SIZE,
  step = 1,
  value,
  ...rootProps
}: RatingProps) => {
  const model = useMemo(
    () => createNumericModel(max, min, step),
    [max, min, step]
  );
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeNumericValue(defaultValue, model)
  );
  const normalizedUncontrolledValue = normalizeNumericValue(
    uncontrolledValue,
    model
  );

  if (!Object.is(uncontrolledValue, normalizedUncontrolledValue)) {
    setUncontrolledValue(normalizedUncontrolledValue);
  }

  const currentTick = normalizeNumericTick(
    controlled ? value : normalizedUncontrolledValue,
    model
  );
  const currentValue = getValueFromTick(currentTick, model);
  const safeSize = normalizePositive(size, DEFAULT_SIZE);
  const safeGap = normalizeGap(gap);

  const handleTickChange = useCallback(
    (tick: number): void => {
      const nextValue = getValueFromTick(tick, model);

      if (!controlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [controlled, model, onChange]
  );

  if (readOnly) {
    return (
      <RatingDisplay
        {...rootProps}
        {...(ref === undefined ? {} : { ref })}
        {...(renderItem === undefined ? {} : { renderItem })}
        accessibilityLabel={accessibilityLabel}
        activeColor={activeColor}
        direction={direction}
        disabled={disabled}
        formatAccessibilityValue={formatAccessibilityValue}
        gap={safeGap}
        inactiveColor={inactiveColor}
        max={model.max}
        orientation={orientation}
        size={safeSize}
        step={model.step}
        value={currentValue}
      />
    );
  }

  return (
    <InteractiveNumericRating
      accessibilityLabel={accessibilityLabel}
      activeColor={activeColor}
      allowClear={allowClear}
      animated={animated}
      currentTick={currentTick}
      direction={direction}
      disabled={disabled}
      focusStyle={focusStyle}
      formatAccessibilityValue={formatAccessibilityValue}
      gap={safeGap}
      inactiveColor={inactiveColor}
      interactionMode={interactionMode}
      model={model}
      onChangeEnd={onChangeEnd}
      onChangeTick={handleTickChange}
      onInteractionStart={onInteractionStart}
      orientation={orientation}
      ref={ref}
      renderItem={renderItem}
      rootProps={rootProps}
      size={safeSize}
    />
  );
};

import type {
  RatingDirection,
  RatingFillOrigin,
  RatingOrientation,
  ResolvedRatingDirection,
} from "../types";

export const DEFAULT_MAX = 5;
export const DEFAULT_SIZE = 28;
export const MAX_ITEMS = 100;
export const MIN_STEP = 0.01;
export const MAX_LAYOUT_VALUE = 1024;

export interface NumericRatingModel {
  max: number;
  maxTick: number;
  minTick: number;
  step: number;
  ticksPerItem: number;
}

interface PositionModel {
  direction: ResolvedRatingDirection;
  extent: number;
  gap: number;
  itemCount: number;
  itemSize: number;
  orientation: RatingOrientation;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export const roundValue = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

export const normalizeMax = (max: number): number => {
  if (!Number.isFinite(max)) {
    return DEFAULT_MAX;
  }

  return clamp(Math.trunc(max), 1, MAX_ITEMS);
};

export const normalizePositive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0
    ? Math.min(value, MAX_LAYOUT_VALUE)
    : fallback;

export const normalizeGap = (gap: number): number =>
  clamp(Number.isFinite(gap) ? gap : 0, 0, MAX_LAYOUT_VALUE);

export const normalizeStep = (step: number): number =>
  Number.isFinite(step) ? clamp(step, MIN_STEP, 1) : 1;

const getStableRatio = (numerator: number, denominator: number): number =>
  roundValue(numerator / denominator);

const getLatticeCeilRatio = (
  numerator: number,
  denominator: number
): number => {
  const quotient = numerator / denominator;
  const nearestInteger = Math.round(quotient);

  return roundValue(nearestInteger * denominator) === roundValue(numerator)
    ? nearestInteger
    : Math.ceil(quotient);
};

export const getTicksPerItem = (step: number): number =>
  getLatticeCeilRatio(1, step);

export const getValueFromTick = (
  tick: number,
  model: Pick<NumericRatingModel, "max" | "step" | "ticksPerItem">
): number => {
  const safeTick = clamp(Math.trunc(tick), 0, model.max * model.ticksPerItem);
  const fullItems = Math.floor(safeTick / model.ticksPerItem);
  const partialTick = safeTick % model.ticksPerItem;

  if (partialTick === 0) {
    return fullItems;
  }

  return roundValue(
    Math.min(model.max, fullItems + Math.min(partialTick * model.step, 1))
  );
};

export const getClosestTick = (
  value: number,
  model: Pick<NumericRatingModel, "max" | "step" | "ticksPerItem">
): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const safeValue = clamp(value, 0, model.max);
  const fullItems = Math.floor(safeValue);

  if (fullItems >= model.max) {
    return model.max * model.ticksPerItem;
  }

  const fraction = safeValue - fullItems;
  const regularTick = clamp(
    Math.round(getStableRatio(fraction, model.step)),
    0,
    model.ticksPerItem - 1
  );
  const regularFraction = regularTick * model.step;
  const useItemEnd = 1 - fraction <= Math.abs(regularFraction - fraction);

  return useItemEnd
    ? (fullItems + 1) * model.ticksPerItem
    : fullItems * model.ticksPerItem + regularTick;
};

export const getCeilTick = (
  value: number,
  model: Pick<NumericRatingModel, "max" | "step" | "ticksPerItem">
): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const safeValue = clamp(value, 0, model.max);
  const fullItems = Math.floor(safeValue);

  if (fullItems >= model.max) {
    return model.max * model.ticksPerItem;
  }

  const fraction = safeValue - fullItems;

  if (fraction === 0) {
    return fullItems * model.ticksPerItem;
  }

  const partialTick = getLatticeCeilRatio(fraction, model.step);

  return partialTick >= model.ticksPerItem
    ? (fullItems + 1) * model.ticksPerItem
    : fullItems * model.ticksPerItem + partialTick;
};

export const createNumericModel = (
  max: number,
  min: number,
  step: number
): NumericRatingModel => {
  const safeMax = normalizeMax(max);
  const safeStep = normalizeStep(step);
  const ticksPerItem = getTicksPerItem(safeStep);
  const baseModel = {
    max: safeMax,
    step: safeStep,
    ticksPerItem,
  };
  const maxTick = safeMax * ticksPerItem;
  const minTick = clamp(Math.max(1, getCeilTick(min, baseModel)), 1, maxTick);

  return {
    ...baseModel,
    maxTick,
    minTick,
  };
};

export const normalizeNumericTick = (
  value: number,
  model: NumericRatingModel
): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return clamp(getClosestTick(value, model), model.minTick, model.maxTick);
};

export const normalizeNumericValue = (
  value: number,
  model: NumericRatingModel
): number => getValueFromTick(normalizeNumericTick(value, model), model);

export const normalizeDisplayValue = (
  value: number,
  max: number,
  step?: number
): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const safeValue = clamp(value, 0, max);

  if (step === undefined) {
    return roundValue(safeValue);
  }

  const safeStep = normalizeStep(step);
  const displayModel = {
    max,
    step: safeStep,
    ticksPerItem: getTicksPerItem(safeStep),
  };

  return getValueFromTick(
    getClosestTick(safeValue, displayModel),
    displayModel
  );
};

export const getItemFill = (value: number, index: number): number =>
  roundValue(clamp(value - index, 0, 1));

export const getTickItemIndex = (tick: number, ticksPerItem: number): number =>
  tick <= 0 ? -1 : Math.max(0, Math.ceil(tick / ticksPerItem) - 1);

export const resolveDirection = (
  direction: RatingDirection,
  applicationIsRTL: boolean
): ResolvedRatingDirection => {
  if (direction !== "auto") {
    return direction;
  }

  return applicationIsRTL ? "rtl" : "ltr";
};

export const getFillOrigin = (
  orientation: RatingOrientation,
  direction: ResolvedRatingDirection
): RatingFillOrigin => {
  if (orientation === "vertical") {
    return "bottom";
  }

  return direction === "rtl" ? "right" : "left";
};

export const getTrackExtent = (
  itemCount: number,
  itemSize: number,
  gap: number
): number => {
  const safeItemCount = clamp(
    Number.isFinite(itemCount) ? Math.trunc(itemCount) : 0,
    0,
    MAX_ITEMS
  );
  const safeItemSize = clamp(
    Number.isFinite(itemSize) ? itemSize : 0,
    0,
    MAX_LAYOUT_VALUE
  );
  const safeGap = normalizeGap(gap);

  return (
    safeItemCount * safeItemSize + Math.max(0, safeItemCount - 1) * safeGap
  );
};

const getLogicalPosition = (
  localPosition: number,
  model: PositionModel
): number => {
  const safePosition = clamp(
    Number.isFinite(localPosition) ? localPosition : 0,
    0,
    model.extent
  );

  const reversedAxis =
    model.orientation === "vertical" ||
    (model.orientation === "horizontal" && model.direction === "rtl");

  return reversedAxis ? model.extent - safePosition : safePosition;
};

export const getNumericTickFromPosition = (
  localPosition: number,
  positionModel: PositionModel,
  ratingModel: NumericRatingModel
): number => {
  const logicalPosition = getLogicalPosition(localPosition, positionModel);

  if (logicalPosition <= 0) {
    return ratingModel.minTick;
  }

  if (logicalPosition >= positionModel.extent) {
    return ratingModel.maxTick;
  }

  const stride = positionModel.itemSize + positionModel.gap;
  let itemIndex = Math.floor(logicalPosition / stride);
  let itemPosition = logicalPosition - itemIndex * stride;

  if (positionModel.gap === 0 && itemPosition === 0 && logicalPosition > 0) {
    itemIndex -= 1;
    itemPosition = positionModel.itemSize;
  }

  itemIndex = clamp(itemIndex, 0, positionModel.itemCount - 1);

  if (itemPosition > positionModel.itemSize) {
    const gapPosition = itemPosition - positionModel.itemSize;
    const previousItemEnd = (itemIndex + 1) * ratingModel.ticksPerItem;
    const nextItemStart = Math.min(ratingModel.maxTick, previousItemEnd + 1);
    const gapTick =
      gapPosition < positionModel.gap / 2 ? previousItemEnd : nextItemStart;

    return clamp(gapTick, ratingModel.minTick, ratingModel.maxTick);
  }

  const fraction = clamp(itemPosition / positionModel.itemSize, 0, 1);
  const partialTick = clamp(
    Math.max(1, getLatticeCeilRatio(fraction, ratingModel.step)),
    1,
    ratingModel.ticksPerItem
  );
  const tick = itemIndex * ratingModel.ticksPerItem + partialTick;

  return clamp(tick, ratingModel.minTick, ratingModel.maxTick);
};

export const getScaleTickFromPosition = (
  localPosition: number,
  model: PositionModel
): number => {
  const logicalPosition = getLogicalPosition(localPosition, model);

  if (logicalPosition <= 0) {
    return 1;
  }

  if (logicalPosition >= model.extent) {
    return model.itemCount;
  }

  const stride = model.itemSize + model.gap;
  let visualIndex = Math.floor(logicalPosition / stride);
  const itemPosition = logicalPosition - visualIndex * stride;

  if (itemPosition > model.itemSize) {
    const gapPosition = itemPosition - model.itemSize;

    if (gapPosition >= model.gap / 2) {
      visualIndex += 1;
    }
  }

  visualIndex = clamp(visualIndex, 0, model.itemCount - 1);

  return visualIndex + 1;
};

export const getIncrementTick = (
  currentTick: number,
  minTick: number,
  maxTick: number
): number =>
  currentTick <= 0
    ? minTick
    : Math.min(maxTick, Math.max(minTick, currentTick + 1));

export const getDecrementTick = (
  currentTick: number,
  minTick: number,
  allowClear: boolean
): number => {
  if (currentTick <= 0) {
    return 0;
  }

  if (currentTick <= minTick) {
    return allowClear ? 0 : minTick;
  }

  return Math.max(minTick, currentTick - 1);
};

export const getHomeTick = (minTick: number, allowClear: boolean): number =>
  allowClear ? 0 : minTick;

export const isRatingScaleValue = (value: unknown): value is number | string =>
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value));

import { describe, expect, it } from "@jest/globals";

import {
  createNumericModel,
  getClosestTick,
  getDecrementTick,
  getFillOrigin,
  getHomeTick,
  getIncrementTick,
  getNumericTickFromPosition,
  getScaleTickFromPosition,
  getTickItemIndex,
  getTrackExtent,
  getValueFromTick,
  MAX_ITEMS,
  MAX_LAYOUT_VALUE,
  normalizeDisplayValue,
  normalizeGap,
  normalizeMax,
  normalizeNumericTick,
  normalizePositive,
  normalizeStep,
  resolveDirection,
} from "../src/internal/model";

describe("numeric rating model", () => {
  it("normalizes unsafe configuration and values", () => {
    expect({
      gap: normalizeGap(Number.NaN),
      infiniteMax: normalizeMax(Number.POSITIVE_INFINITY),
      largeMax: normalizeMax(1000),
      largeSize: normalizePositive(Number.MAX_VALUE, 28),
      negativeSize: normalizePositive(-1, 28),
      oversizedGap: normalizeGap(Number.MAX_VALUE),
      smallStep: normalizeStep(0),
    }).toStrictEqual({
      gap: 0,
      infiniteMax: 5,
      largeMax: 100,
      largeSize: MAX_LAYOUT_VALUE,
      negativeSize: 28,
      oversizedGap: MAX_LAYOUT_VALUE,
      smallStep: 0.01,
    });

    const model = createNumericModel(3.9, 2.2, 0.5);

    expect(model).toStrictEqual({
      max: 3,
      maxTick: 6,
      minTick: 5,
      step: 0.5,
      ticksPerItem: 2,
    });
    expect({
      aboveMax: normalizeNumericTick(99, model),
      belowMin: normalizeNumericTick(1, model),
      invalid: normalizeNumericTick(Number.NaN, model),
      negative: normalizeNumericTick(-3, model),
    }).toStrictEqual({
      aboveMax: 6,
      belowMin: 5,
      invalid: 0,
      negative: 0,
    });
  });

  it.each([
    {
      expected: [0, 0.6, 1, 1.6, 2],
      max: 2,
      step: 0.6,
    },
    {
      expected: [0, 0.25, 0.5, 0.75, 1],
      max: 1,
      step: 0.25,
    },
    {
      expected: [0, 0.3, 0.6, 0.9, 1],
      max: 1,
      step: 0.3,
    },
  ])("keeps the per-item $step tick grid exact", ({ expected, max, step }) => {
    const model = createNumericModel(max, 0, step);

    expect(
      Array.from({ length: model.maxTick + 1 }, (_, tick) =>
        getValueFromTick(tick, model)
      )
    ).toStrictEqual(expected);
  });

  it("keeps every hundredth-step lattice boundary stable", () => {
    let checkedTicks = 0;

    for (let stepHundredths = 1; stepHundredths <= 100; stepHundredths += 1) {
      const step = stepHundredths / 100;
      const model = createNumericModel(1, 0, step);

      for (let tick = 0; tick <= model.maxTick; tick += 1) {
        expect(getClosestTick(getValueFromTick(tick, model), model)).toBe(tick);
        checkedTicks += 1;
      }
    }

    expect(checkedTicks).toBeGreaterThan(100);
  });

  it("does not overshoot exact hundredth minimums or pointer boundaries", () => {
    const model = createNumericModel(1, 0.07, 0.01);
    const positionModel = {
      direction: "ltr" as const,
      extent: 100,
      gap: 0,
      itemCount: 1,
      itemSize: 100,
      orientation: "horizontal" as const,
    };

    expect({
      minTick: model.minTick,
      minValue: getValueFromTick(model.minTick, model),
      pointerTick: getNumericTickFromPosition(7, positionModel, model),
    }).toStrictEqual({
      minTick: 7,
      minValue: 0.07,
      pointerTick: 7,
    });
  });

  it("uses the exposed value lattice for arbitrary-precision boundaries", () => {
    const irregularStep = 0.5993196205575954;
    const irregularValue = 0.59932;
    const irregularModel = createNumericModel(1, irregularValue, irregularStep);
    const seventhModel = createNumericModel(1, 0, 1 / 7);
    const nearQuarterModel = createNumericModel(1, 0, 0.2499999);
    const positionModel = {
      direction: "ltr" as const,
      extent: 100_000,
      gap: 0,
      itemCount: 1,
      itemSize: 100_000,
      orientation: "horizontal" as const,
    };

    expect({
      irregularMinTick: irregularModel.minTick,
      irregularPointerTick: getNumericTickFromPosition(
        irregularValue * positionModel.extent,
        positionModel,
        irregularModel
      ),
      irregularTicks: irregularModel.ticksPerItem,
      irregularValue: getValueFromTick(1, irregularModel),
      nearQuarterTicks: nearQuarterModel.ticksPerItem,
      seventhTicks: seventhModel.ticksPerItem,
      seventhValue: getValueFromTick(7, seventhModel),
    }).toStrictEqual({
      irregularMinTick: 1,
      irregularPointerTick: 1,
      irregularTicks: 2,
      irregularValue,
      nearQuarterTicks: 4,
      seventhTicks: 7,
      seventhValue: 1,
    });
  });

  it("renders exact aggregate display values unless snapping is requested", () => {
    expect(normalizeDisplayValue(4.37, 5)).toBe(4.37);
    expect(normalizeDisplayValue(4.37, 5, 0.5)).toBe(4.5);
    expect(normalizeDisplayValue(Number.NaN, 5)).toBe(0);
    expect(normalizeDisplayValue(8, 5)).toBe(5);
  });

  it("provides consistent increment, decrement, home, and item helpers", () => {
    expect({
      clear: getDecrementTick(3, 3, true),
      decrement: getDecrementTick(6, 3, true),
      empty: getDecrementTick(0, 3, false),
      floor: getDecrementTick(3, 3, false),
      home: getHomeTick(3, false),
      homeClear: getHomeTick(3, true),
      hugeTrack: getTrackExtent(
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      ),
      increment: getIncrementTick(0, 3, 10),
      itemAtThree: getTickItemIndex(3, 2),
      itemAtZero: getTickItemIndex(0, 2),
      max: getIncrementTick(10, 3, 10),
      track: getTrackExtent(5, 28, 4),
    }).toStrictEqual({
      clear: 0,
      decrement: 5,
      empty: 0,
      floor: 3,
      home: 3,
      homeClear: 0,
      hugeTrack: MAX_LAYOUT_VALUE * (MAX_ITEMS * 2 - 1),
      increment: 3,
      itemAtThree: 1,
      itemAtZero: -1,
      max: 10,
      track: 156,
    });
  });
});

describe("rating position model", () => {
  const ratingModel = createNumericModel(3, 0, 0.5);
  const basePositionModel = {
    direction: "ltr" as const,
    extent: 100,
    gap: 5,
    itemCount: 3,
    itemSize: 30,
    orientation: "horizontal" as const,
  };

  it("maps leading, fractional, gap, boundary, and trailing positions", () => {
    expect(
      [0, 7, 15, 30, 32, 34, 35, 50, 100].map((position) =>
        getNumericTickFromPosition(position, basePositionModel, ratingModel)
      )
    ).toStrictEqual([1, 1, 1, 2, 2, 3, 3, 3, 6]);
  });

  it("uses locale direction horizontally and bottom-to-top progression vertically", () => {
    expect(
      getNumericTickFromPosition(
        10,
        { ...basePositionModel, direction: "rtl" },
        ratingModel
      )
    ).toBe(6);
    expect(
      getNumericTickFromPosition(
        10,
        {
          ...basePositionModel,
          direction: "rtl",
          orientation: "vertical",
        },
        ratingModel
      )
    ).toBe(6);
  });

  it("maps scale slots along the logical slider axis", () => {
    const scaleModel = {
      ...basePositionModel,
      itemCount: 3,
    };

    expect(getScaleTickFromPosition(0, scaleModel)).toBe(1);
    expect(getScaleTickFromPosition(100, scaleModel)).toBe(3);
    expect(
      getScaleTickFromPosition(10, {
        ...scaleModel,
        direction: "rtl",
      })
    ).toBe(3);
    expect(
      getScaleTickFromPosition(10, {
        ...scaleModel,
        orientation: "vertical",
      })
    ).toBe(3);
    expect(
      getScaleTickFromPosition(90, {
        ...scaleModel,
        orientation: "vertical",
      })
    ).toBe(1);
  });

  it("resolves direction and fractional fill origins once", () => {
    expect({
      autoLTR: resolveDirection("auto", false),
      autoRTL: resolveDirection("auto", true),
      explicit: resolveDirection("ltr", true),
      horizontalLTR: getFillOrigin("horizontal", "ltr"),
      horizontalRTL: getFillOrigin("horizontal", "rtl"),
      vertical: getFillOrigin("vertical", "rtl"),
    }).toStrictEqual({
      autoLTR: "ltr",
      autoRTL: "rtl",
      explicit: "ltr",
      horizontalLTR: "left",
      horizontalRTL: "right",
      vertical: "bottom",
    });
  });
});

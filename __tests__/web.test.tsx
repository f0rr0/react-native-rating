import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { Rating, RatingDisplay, RatingScale } from "../src";
import type { RatingProps } from "../src";

const hidden = { includeHiddenElements: true };
const originalPlatformOS = Platform.OS;
const sentimentItems = [
  { content: "😞", label: "Negative", value: -1 },
  { content: "😐", label: "Neutral", value: 0 },
  { content: "🙂", label: "Positive", value: 1 },
] as const;

const setPlatformOS = (os: typeof Platform.OS): void => {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: os,
  });
};

const pressKey = async (
  key: string,
  modifiers: {
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
  } = {}
): Promise<{
  preventDefault: jest.Mock<() => void>;
  stopPropagation: jest.Mock<() => void>;
}> => {
  const preventDefault = jest.fn<() => void>();
  const stopPropagation = jest.fn<() => void>();

  await fireEvent(screen.getByTestId("rating"), "keyDown", {
    ...modifiers,
    key,
    preventDefault,
    stopPropagation,
  });

  return { preventDefault, stopPropagation };
};

const tap = async (testID: string, locationX: number): Promise<void> => {
  const control = screen.getByTestId(`${testID}-control`, hidden);
  const nativeEvent = {
    locationX,
    locationY: 20,
    pageX: locationX,
    pageY: 20,
    touches: [{}],
  };

  await fireEvent(control, "responderGrant", { nativeEvent });
  await fireEvent(control, "responderRelease", {
    nativeEvent: { ...nativeEvent, touches: [] },
  });
};

describe("web contract", () => {
  beforeAll(() => {
    setPlatformOS("web");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    setPlatformOS(originalPlatformOS);
  });

  it("exposes direct decimal ARIA slider values and orientation", async () => {
    await render(
      <Rating
        accessibilityLabel="Review score"
        animated={false}
        max={7}
        orientation="vertical"
        step={0.5}
        testID="rating"
        value={2.5}
      />
    );
    const slider = screen.getByTestId("rating");

    expect(slider.props).toMatchObject({
      accessibilityRole: "adjustable",
      "aria-disabled": false,
      "aria-label": "Review score",
      "aria-orientation": "vertical",
      "aria-valuemax": 7,
      "aria-valuemin": 0.5,
      "aria-valuenow": 2.5,
      "aria-valuetext": "2.5 out of 7",
      role: "slider",
      tabIndex: 0,
    });
    expect(slider.props).not.toHaveProperty("accessibilityValue");
  });

  it("exposes semantic scale positions and labels without losing zero", async () => {
    await render(
      <RatingScale
        animated={false}
        items={sentimentItems}
        orientation="vertical"
        testID="scale"
        value={0}
      />
    );

    expect(screen.getByTestId("scale").props).toMatchObject({
      "aria-orientation": "vertical",
      "aria-valuemax": 3,
      "aria-valuemin": 1,
      "aria-valuenow": 2,
      "aria-valuetext": "Neutral",
      role: "slider",
      tabIndex: 0,
    });
  });

  it("keeps reversed semantic values on the logical vertical slider axis", async () => {
    const onChange = jest.fn<(value: number | null) => void>();

    await render(
      <RatingScale
        animated={false}
        defaultValue={1}
        items={sentimentItems}
        onChange={onChange}
        orientation="vertical"
        reversed
        testID="scale"
      />
    );

    const slider = screen.getByTestId("scale");

    const keyboardEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    await fireEvent(slider, "keyDown", {
      ...keyboardEvent,
      key: "ArrowUp",
    });
    await fireEvent(slider, "keyDown", {
      ...keyboardEvent,
      key: "Home",
    });
    await fireEvent(slider, "keyDown", {
      ...keyboardEvent,
      key: "End",
    });

    expect(onChange.mock.calls).toStrictEqual([[0], [1], [-1]]);
    expect(slider.props).toMatchObject({
      "aria-valuenow": 3,
      "aria-valuetext": "Negative",
    });
    expect(screen.getByTestId("scale-control", hidden)).toHaveStyle({
      flexDirection: "column-reverse",
    });
  });

  it("implements Arrow, Home, and End keys and consumes only handled keys", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();

    await render(
      <Rating
        animated={false}
        defaultValue={2}
        max={5}
        min={1}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        step={0.5}
        testID="rating"
      />
    );

    const right = await pressKey("ArrowRight");
    const up = await pressKey("ArrowUp");
    const left = await pressKey("ArrowLeft");
    const down = await pressKey("ArrowDown");
    const home = await pressKey("Home");
    const end = await pressKey("End");

    const ignored = await pressKey("PageUp");
    expect(
      [right, up, left, down, home, end].map((event) => ({
        prevented: event.preventDefault.mock.calls.length,
        stopped: event.stopPropagation.mock.calls.length,
      }))
    ).toStrictEqual([
      { prevented: 1, stopped: 1 },
      { prevented: 1, stopped: 1 },
      { prevented: 1, stopped: 1 },
      { prevented: 1, stopped: 1 },
      { prevented: 1, stopped: 1 },
      { prevented: 1, stopped: 1 },
    ]);
    expect({
      prevented: ignored.preventDefault.mock.calls.length,
      stopped: ignored.stopPropagation.mock.calls.length,
    }).toStrictEqual({ prevented: 0, stopped: 0 });
    expect({
      changes: onChange.mock.calls,
      ends: onChangeEnd.mock.calls,
      starts: onInteractionStart.mock.calls,
    }).toStrictEqual({
      changes: [[2.5], [3], [2.5], [2], [1], [5]],
      ends: [
        [2.5, { cancelled: false, source: "keyboard" }],
        [3, { cancelled: false, source: "keyboard" }],
        [2.5, { cancelled: false, source: "keyboard" }],
        [2, { cancelled: false, source: "keyboard" }],
        [1, { cancelled: false, source: "keyboard" }],
        [5, { cancelled: false, source: "keyboard" }],
      ],
      starts: [
        [2, { source: "keyboard" }],
        [2.5, { source: "keyboard" }],
        [3, { source: "keyboard" }],
        [2.5, { source: "keyboard" }],
        [2, { source: "keyboard" }],
        [1, { source: "keyboard" }],
      ],
    });
    expect(screen.getByTestId("rating").props).toMatchObject({
      "aria-valuemin": 1,
      "aria-valuenow": 5,
      "aria-valuetext": "5 out of 5",
    });
  });

  it("lets Home clear only when the empty sentinel is enabled", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        allowClear
        animated={false}
        defaultValue={3}
        min={2}
        onChange={onChange}
        testID="rating"
      />
    );

    await fireEvent(screen.getByTestId("rating"), "keyDown", {
      nativeEvent: { key: "Home" },
      preventDefault: jest.fn(),
    });

    expect(onChange).toHaveBeenCalledWith(0);
    expect(screen.getByTestId("rating").props).toMatchObject({
      "aria-valuemin": 0,
      "aria-valuenow": 0,
      "aria-valuetext": "0 out of 5",
    });
  });

  it("keeps the empty lower bound stable and preserves modified shortcuts", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating animated={false} min={2} onChange={onChange} testID="rating" />
    );

    const left = await pressKey("ArrowLeft");
    const down = await pressKey("ArrowDown");
    const altLeft = await pressKey("ArrowLeft", { altKey: true });

    expect(onChange).not.toHaveBeenCalled();
    expect([
      left.preventDefault.mock.calls.length,
      down.preventDefault.mock.calls.length,
      altLeft.preventDefault.mock.calls.length,
    ]).toStrictEqual([1, 1, 0]);
    expect(screen.getByTestId("rating").props).toMatchObject({
      "aria-valuemin": 0,
      "aria-valuenow": 0,
    });
  });

  it("removes disabled controls from the tab order and ignores input", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        disabled
        onChange={onChange}
        testID="rating"
        value={3}
      />
    );
    const slider = screen.getByTestId("rating");

    expect(slider.props).toMatchObject({
      accessibilityState: { disabled: true },
      "aria-disabled": true,
      role: "slider",
      tabIndex: -1,
    });
    expect(slider.props).not.toHaveProperty("onKeyDown");
    await fireEvent(slider, "keyDown", { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
    const control = screen.getByTestId("rating-control", hidden);
    expect(control.props).not.toHaveProperty("pointerEvents");
    expect(StyleSheet.flatten(control.props.style)).toMatchObject({
      pointerEvents: "none",
    });
  });

  it("composes consumer focus handlers with a visible browser focus ring", async () => {
    const onBlur = jest.fn<NonNullable<RatingProps["onBlur"]>>();
    const onFocus = jest.fn<NonNullable<RatingProps["onFocus"]>>();

    const view = await render(
      <Rating
        animated={false}
        onBlur={onBlur}
        onFocus={onFocus}
        testID="rating"
      />
    );
    const slider = screen.getByTestId("rating");
    const focusEvent = { nativeEvent: {} };

    await fireEvent(slider, "focus", focusEvent);
    expect(onFocus).toHaveBeenCalledWith(focusEvent);
    expect(slider).toHaveStyle({
      boxShadow: "0 0 0 4px #FFFFFF",
      outlineColor: "#1D4ED8",
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    });

    await fireEvent(slider, "blur", focusEvent);
    expect(onBlur).toHaveBeenCalledWith(focusEvent);
    expect(StyleSheet.flatten(slider.props.style)).not.toHaveProperty(
      "outlineWidth"
    );

    await view.rerender(
      <Rating
        animated={false}
        focusStyle={{ outlineColor: "#D946EF" }}
        onBlur={onBlur}
        onFocus={onFocus}
        testID="rating"
      />
    );
    await fireEvent(slider, "focus", focusEvent);
    expect(slider).toHaveStyle({ outlineColor: "#D946EF" });
  });

  it("preserves scrolling on the cross axis for drag-enabled tracks", async () => {
    const view = await render(
      <Rating animated={false} interactionMode="tap-and-drag" testID="rating" />
    );

    expect(
      StyleSheet.flatten(
        screen.getByTestId("rating-control", hidden).props.style
      )
    ).toMatchObject({
      touchAction: "pan-y",
      userSelect: "none",
    });

    await view.rerender(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        orientation="vertical"
        testID="rating"
      />
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId("rating-control", hidden).props.style
      )
    ).toMatchObject({
      touchAction: "pan-x",
      userSelect: "none",
    });

    await view.rerender(
      <Rating animated={false} interactionMode="tap" testID="rating" />
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId("rating-control", hidden).props.style
      )
    ).not.toHaveProperty("touchAction");
  });

  it("keeps Web responder dragging local when locationX changes", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        testID="rating"
        value={1}
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(control, "responderGrant", {
      nativeEvent: {
        locationX: 10,
        locationY: 20,
        pageX: 110,
        pageY: 20,
        touches: [{}],
      },
    });
    await fireEvent(control, "responderMove", {
      nativeEvent: {
        locationX: 999,
        locationY: 20,
        pageX: 175,
        pageY: 21,
        touches: [{}],
      },
    });

    expect(onChange).toHaveBeenCalledWith(3);
    expect(screen.getByTestId("rating").props).toMatchObject({
      "aria-valuenow": 3,
      "aria-valuetext": "3 out of 5",
    });
  });

  it("combines exact static values with labels and no slider behavior", async () => {
    await render(
      <View>
        <RatingDisplay
          accessibilityLabel="Average review"
          disabled
          testID="display"
          value={4.37}
        />
        <RatingScale
          accessibilityLabel="Sentiment"
          disabled
          items={sentimentItems}
          readOnly
          testID="scale"
          value={0}
        />
      </View>
    );

    expect(screen.getByTestId("display").props).toMatchObject({
      accessibilityLabel: "Average review, 4.37 out of 5",
      accessibilityRole: "image",
      "aria-disabled": true,
      "aria-label": "Average review, 4.37 out of 5",
    });
    expect(screen.getByTestId("scale").props).toMatchObject({
      accessibilityLabel: "Sentiment, Neutral",
      accessibilityRole: "image",
      "aria-disabled": true,
      "aria-label": "Sentiment, Neutral",
    });
    expect([
      screen.getByTestId("display").props.accessibilityValue === undefined,
      screen.getByTestId("display").props.tabIndex === undefined,
      screen.getByTestId("scale").props.accessibilityValue === undefined,
      screen.getByTestId("scale").props.onKeyDown === undefined,
    ]).toStrictEqual([true, true, true, true]);
  });

  it("uses the JavaScript animation driver for Web completion feedback", async () => {
    const remove = jest.fn<() => void>();
    const start = jest.fn<() => void>();
    const originalTiming = Animated.timing;
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove });
    const timing = jest
      .spyOn(Animated, "timing")
      .mockImplementation((value, config) => ({
        ...originalTiming(value, config),
        start,
      }));
    const view = await render(<Rating testID="rating" />);

    await act(async () => {
      await Promise.resolve();
    });
    await tap("rating", 70);

    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        isInteraction: false,
        useNativeDriver: false,
      })
    );
    expect(start).toHaveBeenCalledTimes(1);

    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

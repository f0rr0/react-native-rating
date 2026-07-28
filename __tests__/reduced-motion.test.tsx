import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, View } from "react-native";

import { Rating } from "../src";

const hidden = { includeHiddenElements: true };

const hasTransformStyle = (style: unknown): boolean => {
  if (Array.isArray(style)) {
    return style.some((entry) => hasTransformStyle(entry));
  }

  return (
    typeof style === "object" &&
    style !== null &&
    Object.hasOwn(style, "transform")
  );
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

describe("shared reduced-motion store", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates no subscription when animation feedback is disabled", async () => {
    const subscribe = jest.spyOn(AccessibilityInfo, "addEventListener");

    await render(<Rating animated={false} testID="rating" />);
    await tap("rating", 70);

    expect(subscribe).not.toHaveBeenCalled();
  });

  it("shares one native subscription and animates only accepted completions", async () => {
    const remove = jest.fn<() => void>();
    const animationStart = jest.fn<() => void>();
    const animationStop = jest.fn<() => void>();
    const originalTiming = Animated.timing;
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(false);
    const subscribe = jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove });
    const timing = jest
      .spyOn(Animated, "timing")
      .mockImplementation((value, config) => ({
        ...originalTiming(value, config),
        start: animationStart,
        stop: animationStop,
      }));

    const view = await render(
      <View>
        <Rating testID="first" />
        <Rating testID="second" />
      </View>
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(subscribe.mock.calls).toStrictEqual([
      ["reduceMotionChanged", expect.any(Function)],
    ]);

    await tap("first", 70);
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        duration: 150,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      })
    );
    expect({
      animationStarts: animationStart.mock.calls.length,
      timingCalls: timing.mock.calls.length,
    }).toStrictEqual({ animationStarts: 1, timingCalls: 1 });
    const pulseWasVisible = hasTransformStyle(
      screen.getByTestId("first-item-3", hidden).props.style as unknown
    );

    await view.rerender(
      <View>
        <Rating disabled testID="first" />
        <Rating testID="second" />
      </View>
    );
    await view.rerender(
      <View>
        <Rating testID="first" />
        <Rating testID="second" />
      </View>
    );
    const pulseWasCleared = !hasTransformStyle(
      screen.getByTestId("first-item-3", hidden).props.style as unknown
    );

    const listener = subscribe.mock.calls[0]?.[1];
    await act(() => {
      if (listener) {
        listener(true);
      }
    });
    await tap("second", 70);

    await view.unmount();
    expect({
      animationStops: animationStop.mock.calls.length,
      pulseCleared: pulseWasCleared,
      pulseStarted: pulseWasVisible,
      removals: remove.mock.calls.length,
      timingCalls: timing.mock.calls.length,
    }).toStrictEqual({
      animationStops: 1,
      pulseCleared: true,
      pulseStarted: true,
      removals: 1,
      timingCalls: 1,
    });
  });

  it("returns to a conservative snapshot between mounted rating groups", async () => {
    const { promise: pendingPreference, resolve: resolvePreference } =
      Promise.withResolvers<boolean>();
    const originalTiming = Animated.timing;
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValueOnce(false)
      .mockReturnValueOnce(pendingPreference);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn<() => void>() });
    const timing = jest
      .spyOn(Animated, "timing")
      .mockImplementation((value, config) => ({
        ...originalTiming(value, config),
        start: jest.fn<() => void>(),
        stop: jest.fn<() => void>(),
      }));

    const first = await render(<Rating testID="first" />);
    await act(async () => {
      await Promise.resolve();
    });
    await tap("first", 70);
    expect(timing).toHaveBeenCalledTimes(1);
    await first.unmount();

    timing.mockClear();
    const second = await render(<Rating testID="second" />);
    await tap("second", 70);
    expect(timing).not.toHaveBeenCalled();

    await act(async () => {
      resolvePreference(true);
      await pendingPreference;
    });
    await second.unmount();
    expect(timing).not.toHaveBeenCalled();
  });
});

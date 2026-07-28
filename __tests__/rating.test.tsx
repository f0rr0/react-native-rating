import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, I18nManager, Text } from "react-native";

import { Rating } from "../src";
import type { RatingProps } from "../src";

const hidden = { includeHiddenElements: true };

const responderEvent = ({
  locationX,
  locationY = 20,
  pageX = locationX,
  pageY = locationY,
  touches = [{}],
}: {
  locationX: number;
  locationY?: number;
  pageX?: number;
  pageY?: number;
  touches?: readonly unknown[];
}) => ({
  nativeEvent: {
    locationX,
    locationY,
    pageX,
    pageY,
    touches,
  },
});

const tapTrack = async (
  testID: string,
  locationX: number,
  locationY = 20
): Promise<void> => {
  const control = screen.getByTestId(`${testID}-control`, hidden);
  const event = responderEvent({ locationX, locationY });
  await fireEvent(control, "responderGrant", event);
  await fireEvent(control, "responderRelease", {
    ...event,
    nativeEvent: { ...event.nativeEvent, touches: [] },
  });
};

describe("rating", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exposes one adjustable control and hides decorative descendants", async () => {
    await render(<Rating animated={false} defaultValue={2} testID="rating" />);

    const rating = screen.getByRole("adjustable", { name: "Rating" });
    const control = screen.getByTestId("rating-control", hidden);

    expect(rating).toHaveAccessibilityValue({
      max: 5,
      min: 1,
      now: 2,
      text: "2 out of 5",
    });
    expect(control).toHaveProp("accessibilityElementsHidden", true);
    expect(control).toHaveProp(
      "importantForAccessibility",
      "no-hide-descendants"
    );
    expect(screen.getAllByTestId(/rating-item-/u, hidden)).toHaveLength(5);
    expect(screen.queryByText("★")).toBeNull();
  });

  it("keeps runtime root semantics and responder ownership authoritative", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const hostileRootProps = {
      accessible: false,
      "aria-hidden": true,
      onKeyDown: jest.fn(),
      onStartShouldSetResponderCapture: jest.fn(() => true),
      pointerEvents: "none" as const,
    };

    await render(
      <Rating
        {...hostileRootProps}
        animated={false}
        onChange={onChange}
        testID="rating"
      />
    );

    const rating = screen.getByTestId("rating");
    expect(rating.props).toMatchObject({
      accessibilityRole: "adjustable",
      accessible: true,
    });
    expect(rating.props).not.toHaveProperty("aria-hidden");
    expect(rating.props).not.toHaveProperty("onStartShouldSetResponderCapture");
    expect(rating.props).not.toHaveProperty("pointerEvents");

    await tapTrack("rating", 70);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("updates uncontrolled state after a root-track tap", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();

    await render(
      <Rating
        animated={false}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="rating"
      />
    );
    await tapTrack("rating", 70);

    expect(onInteractionStart).toHaveBeenCalledWith(0, {
      source: "pointer",
    });
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onChangeEnd).toHaveBeenCalledWith(3, {
      cancelled: false,
      source: "pointer",
    });
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 3,
    });
  });

  it("keeps controlled state owned by the parent", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const view = await render(
      <Rating animated={false} onChange={onChange} testID="rating" value={1} />
    );

    await tapTrack("rating", 100);
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 1,
    });

    await view.rerender(
      <Rating animated={false} onChange={onChange} testID="rating" value={4} />
    );
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 4,
    });
  });

  it("uses one exact fractional value for callback, fill, and accessibility", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        onChange={onChange}
        renderItem={({ fill, fillOrigin, index }) => (
          <Text testID={`fill-${index}`}>{`${fill}:${fillOrigin}`}</Text>
        )}
        size={40}
        step={0.5}
        testID="rating"
        value={1.5}
      />
    );

    expect(screen.getByTestId("fill-0", hidden)).toHaveTextContent("1:left");
    expect(screen.getByTestId("fill-1", hidden)).toHaveTextContent("0.5:left");

    await tapTrack("rating", 90);
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("gives custom renderers ownership of pressed visuals", async () => {
    await render(
      <Rating
        animated={false}
        renderItem={({ index, pressed }) => (
          <Text testID={`pressed-${index}`}>{String(pressed)}</Text>
        )}
        testID="rating"
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 10 })
    );

    expect(screen.getByTestId("pressed-0", hidden)).toHaveTextContent("true");
    expect(screen.getByTestId("rating-item-1", hidden)).not.toHaveStyle({
      transform: [{ scale: 0.94 }],
    });

    await fireEvent(control, "responderTerminate", {
      nativeEvent: {
        ...responderEvent({ locationX: 10 }).nativeEvent,
        touches: [],
      },
    });
    expect(screen.getByTestId("pressed-0", hidden)).toHaveTextContent("false");
  });

  it("preserves non-divisor per-item steps", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        onChange={onChange}
        size={48}
        step={0.6}
        testID="rating"
      />
    );

    await tapTrack("rating", 20);
    await tapTrack("rating", 48);

    expect(onChange).toHaveBeenNthCalledWith(1, 0.6);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("enforces min while preserving zero as the unrated sentinel", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        allowClear
        animated={false}
        min={3}
        onChange={onChange}
        testID="rating"
      />
    );

    await tapTrack("rating", 2);
    expect(onChange).toHaveBeenLastCalledWith(3);

    const rating = screen.getByRole("adjustable");
    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(onChange).toHaveBeenLastCalledWith(0);

    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("keeps an empty rating empty when decrement cannot clear", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating animated={false} min={3} onChange={onChange} testID="rating" />
    );

    const rating = screen.getByRole("adjustable");
    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(rating).toHaveAccessibilityValue({
      max: 5,
      min: 0,
      now: 0,
      text: "0 out of 5",
    });
  });

  it("clears only a true same-value tap", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        allowClear
        animated={false}
        defaultValue={3}
        interactionMode="tap-and-drag"
        onChange={onChange}
        testID="rating"
      />
    );

    await tapTrack("rating", 70);
    expect(onChange).toHaveBeenCalledWith(0);

    await tapTrack("rating", 70);
    const control = screen.getByTestId("rating-control", hidden);
    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 10, pageX: 110, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 10, pageX: 180, pageY: 51 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 10, pageX: 110, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 10,
        pageX: 110,
        pageY: 50,
        touches: [],
      })
    );

    expect(onChange.mock.calls.at(-1)?.[0]).toBe(1);
  });

  it("tracks a deliberate drag with stable page coordinates and no duplicates", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="rating"
        value={1}
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 10, pageX: 110, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 999, pageX: 175, pageY: 51 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: -50, pageX: 175, pageY: 51 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: -50, pageX: 205, pageY: 51 })
    );

    expect(onInteractionStart).toHaveBeenCalledTimes(1);
    expect(onInteractionStart).toHaveBeenCalledWith(1, {
      source: "pointer",
    });
    expect(onChange.mock.calls).toStrictEqual([[3], [4]]);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 4,
    });

    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: -50,
        pageX: 205,
        pageY: 51,
        touches: [],
      })
    );
    expect(onChangeEnd).toHaveBeenCalledWith(4, {
      cancelled: false,
      source: "pointer",
    });
  });

  it("yields cross-axis scrolling before accepting an interaction", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="rating"
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 10, pageX: 100, pageY: 100 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 10, pageX: 102, pageY: 130 })
    );

    await fireEvent(control, "responderTerminate");
    expect(onChange).not.toHaveBeenCalled();
    expect(onInteractionStart).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();
  });

  it("reports a system-terminated accepted drag without replaying values", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        testID="rating"
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 5, pageX: 175, pageY: 50 })
    );

    await fireEvent(control, "responderTerminate");
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onChangeEnd).toHaveBeenCalledWith(3, {
      cancelled: true,
      source: "pointer",
    });
  });

  it("finalizes an accepted drag when the interactive path unmounts", async () => {
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();
    const view = await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="rating"
        value={1}
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 5, pageX: 175, pageY: 50 })
    );
    await view.rerender(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        readOnly
        testID="rating"
        value={1}
      />
    );
    await view.unmount();

    expect(onInteractionStart).toHaveBeenCalledTimes(1);
    expect(onChangeEnd.mock.calls).toStrictEqual([
      [3, { cancelled: true, source: "pointer" }],
    ]);
  });

  it("cancels an accepted drag exactly once when a second pointer arrives", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        testID="rating"
        value={1}
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 5, pageX: 175, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderStart",
      responderEvent({
        locationX: 5,
        pageX: 180,
        pageY: 50,
        touches: [{}, {}],
      })
    );
    await fireEvent(
      control,
      "responderEnd",
      responderEvent({
        locationX: 5,
        pageX: 180,
        pageY: 50,
        touches: [{}],
      })
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 5,
        pageX: 180,
        pageY: 50,
        touches: [],
      })
    );

    expect(onChange.mock.calls).toStrictEqual([[3]]);
    expect(onChangeEnd).toHaveBeenCalledTimes(1);
    expect(onChangeEnd).toHaveBeenCalledWith(3, {
      cancelled: true,
      source: "pointer",
    });
  });

  it("does not turn a two-pointer press into a tap after a partial lift", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="rating"
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderStart",
      responderEvent({
        locationX: 5,
        pageX: 105,
        pageY: 50,
        touches: [{}, {}],
      })
    );
    await fireEvent(
      control,
      "responderEnd",
      responderEvent({
        locationX: 5,
        pageX: 105,
        pageY: 50,
        touches: [{}],
      })
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 100,
        pageX: 200,
        pageY: 50,
        touches: [],
      })
    );

    expect({
      changes: onChange.mock.calls,
      ends: onChangeEnd.mock.calls,
      starts: onInteractionStart.mock.calls,
    }).toStrictEqual({ changes: [], ends: [], starts: [] });
  });

  it("cancels a live drag when disabled changes", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();
    const view = await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        testID="rating"
        value={1}
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 5, pageX: 175, pageY: 50 })
    );
    await view.rerender(
      <Rating
        animated={false}
        disabled
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        testID="rating"
        value={1}
      />
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 5, pageX: 210, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 5,
        pageX: 210,
        pageY: 50,
        touches: [],
      })
    );

    expect(onChange.mock.calls).toStrictEqual([[3]]);
    expect(onChangeEnd.mock.calls).toStrictEqual([
      [3, { cancelled: true, source: "pointer" }],
    ]);
    expect(
      screen.getByTestId("rating-control", hidden).props.pointerEvents
    ).toBe("none");
  });

  it("cancels old geometry without decoding it through new structure", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();
    const view = await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        step={1}
        testID="rating"
        value={1}
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderMove",
      responderEvent({ locationX: 5, pageX: 175, pageY: 50 })
    );
    await view.rerender(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        step={0.5}
        testID="rating"
        value={1}
      />
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 5,
        pageX: 205,
        pageY: 50,
        touches: [],
      })
    );

    expect(onChange.mock.calls).toStrictEqual([[3]]);
    expect(onChangeEnd.mock.calls).toStrictEqual([
      [3, { cancelled: true, source: "pointer" }],
    ]);
  });

  it("rejects a far tap release when no move event was delivered", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const onChangeEnd = jest.fn<NonNullable<RatingProps["onChangeEnd"]>>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingProps["onInteractionStart"]>>();

    await render(
      <Rating
        animated={false}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="rating"
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 100,
        pageX: 200,
        pageY: 50,
        touches: [],
      })
    );

    expect({
      changes: onChange.mock.calls,
      ends: onChangeEnd.mock.calls,
      starts: onInteractionStart.mock.calls,
    }).toStrictEqual({ changes: [], ends: [], starts: [] });
  });

  it("promotes a primary-axis far release to a drag when enabled", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        interactionMode="tap-and-drag"
        onChange={onChange}
        testID="rating"
      />
    );
    const control = screen.getByTestId("rating-control", hidden);

    await fireEvent(
      control,
      "responderGrant",
      responderEvent({ locationX: 5, pageX: 105, pageY: 50 })
    );
    await fireEvent(
      control,
      "responderRelease",
      responderEvent({
        locationX: 100,
        pageX: 200,
        pageY: 50,
        touches: [],
      })
    );

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("uses the latest callbacks and configuration without rebuilding responders", async () => {
    const firstOnChange = jest.fn<(value: number) => void>();
    const latestOnChange = jest.fn<(value: number) => void>();
    const view = await render(
      <Rating
        animated={false}
        max={5}
        onChange={firstOnChange}
        testID="rating"
      />
    );

    await view.rerender(
      <Rating
        animated={false}
        max={3}
        onChange={latestOnChange}
        testID="rating"
      />
    );
    await tapTrack("rating", 70);

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(latestOnChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      max: 3,
      now: 3,
    });
  });

  it("updates fallback geometry before the next native layout event", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const view = await render(
      <Rating animated={false} onChange={onChange} size={28} testID="rating" />
    );

    await view.rerender(
      <Rating animated={false} onChange={onChange} size={56} testID="rating" />
    );
    await tapTrack("rating", 200);

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("supports explicit RTL and vertical geometry", async () => {
    const onRTLChange = jest.fn<(value: number) => void>();
    const onVerticalChange = jest.fn<(value: number) => void>();

    jest.replaceProperty(I18nManager, "isRTL", false);
    const view = await render(
      <Rating
        animated={false}
        direction="rtl"
        onChange={onRTLChange}
        renderItem={({ direction, fillOrigin, index }) => (
          <Text testID={`direction-${index}`}>
            {`${direction}:${fillOrigin}`}
          </Text>
        )}
        testID="rating"
      />
    );

    expect(screen.getByTestId("direction-0", hidden)).toHaveTextContent(
      "rtl:right"
    );
    await tapTrack("rating", 5);
    expect(onRTLChange).toHaveBeenCalledWith(5);

    await view.rerender(
      <Rating
        animated={false}
        onChange={onVerticalChange}
        orientation="vertical"
        renderItem={({ fillOrigin, index }) => (
          <Text testID={`vertical-${index}`}>{fillOrigin}</Text>
        )}
        testID="rating"
      />
    );
    await tapTrack("rating", 20, 70);
    await tapTrack("rating", 20, 5);
    await tapTrack("rating", 20, 135);
    expect(onVerticalChange.mock.calls).toStrictEqual([[3], [5], [1]]);
    expect(screen.getByTestId("vertical-0", hidden)).toHaveTextContent(
      "bottom"
    );
    expect(screen.getByTestId("rating-control", hidden)).toHaveStyle({
      flexDirection: "column-reverse",
      height: 140,
      width: 44,
    });
  });

  it("normalizes configuration changes without reviving stale state", async () => {
    const view = await render(
      <Rating animated={false} defaultValue={5} max={5} testID="rating" />
    );

    await view.rerender(<Rating animated={false} max={3} testID="rating" />);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 3,
    });

    await view.rerender(<Rating animated={false} max={5} testID="rating" />);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 3,
    });
  });

  it("suppresses every interaction path while disabled", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        defaultValue={2}
        disabled
        onChange={onChange}
        testID="rating"
      />
    );
    const rating = screen.getByRole("adjustable");
    const control = screen.getByTestId("rating-control", hidden);

    expect(rating).toBeDisabled();
    expect(rating.props.accessibilityActions).toBeUndefined();
    expect(rating.props.onAccessibilityAction).toBeUndefined();
    expect(control).toHaveProp("pointerEvents", "none");
    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("delegates read-only ratings to the static allocation-light path", async () => {
    const subscribe = jest.spyOn(AccessibilityInfo, "addEventListener");
    const timing = jest.spyOn(Animated, "timing");

    await render(<Rating defaultValue={4} readOnly testID="rating" />);

    expect(
      screen.getByRole("image", { name: "Rating" })
    ).toHaveAccessibilityValue({ text: "4 out of 5" });
    expect(
      screen.getByTestId("rating-control", hidden).props
        .onStartShouldSetResponder
    ).toBeUndefined();
    expect(screen.getByTestId("rating-item-2", hidden)).toHaveStyle({
      height: 28,
      width: 28,
    });
    expect(subscribe).not.toHaveBeenCalled();
    expect(timing).not.toHaveBeenCalled();
  });

  it("preserves disabled state through the read-only compatibility path", async () => {
    await render(
      <Rating
        disabled
        readOnly
        renderItem={({ disabled, index }) => (
          <Text testID={`disabled-${index}`}>{String(disabled)}</Text>
        )}
        testID="rating"
        value={3}
      />
    );

    expect(screen.getByRole("image")).toBeDisabled();
    expect(screen.getByTestId("disabled-0", hidden)).toHaveTextContent("true");
    expect(screen.getByTestId("rating")).toHaveStyle({ opacity: 0.45 });
  });

  it("forwards native root props and keeps structural direction authoritative", async () => {
    const onLayout = jest.fn();

    await render(
      <Rating
        accessibilityHint="Adjust the review score"
        animated={false}
        direction="ltr"
        onLayout={onLayout}
        style={{ direction: "rtl", marginTop: 7, opacity: 0.2 }}
        testID="rating"
      />
    );

    const rating = screen.getByTestId("rating");
    expect(rating).toHaveProp("accessibilityHint", "Adjust the review score");
    expect(rating).toHaveProp("onLayout", onLayout);
    expect(rating).toHaveStyle({
      direction: "ltr",
      marginTop: 7,
      opacity: 0.2,
    });
  });
});

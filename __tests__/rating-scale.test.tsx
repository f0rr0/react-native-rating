import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useId } from "react";
import type { ReactNode } from "react";
import { AccessibilityInfo, Animated, Text } from "react-native";

import { RatingScale } from "../src";
import type { RatingScaleProps, RatingScaleRenderItemProps } from "../src";

const hidden = { includeHiddenElements: true };
const sentimentItems = [
  { content: "😞", label: "Negative", value: -1 },
  { content: "😐", label: "Neutral", value: 0 },
  { content: "🙂", label: "Positive", value: 1 },
] as const;

const StatefulScaleItem = ({ value }: { value: number }) => {
  const instance = useId();

  return <Text testID={`stateful-${value}`}>{`${value}:${instance}`}</Text>;
};

const renderStatefulScaleItem = ({
  value,
}: RatingScaleRenderItemProps<number>) => <StatefulScaleItem value={value} />;

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

const gestureEvent = (
  locationX: number,
  pageX = locationX,
  pageY = 20,
  touches: readonly unknown[] = [{}]
) => ({
  nativeEvent: {
    locationX,
    locationY: 20,
    pageX,
    pageY,
    touches,
  },
});

const tapScale = async (locationX: number): Promise<void> => {
  const control = screen.getByTestId("scale-control", hidden);
  const event = gestureEvent(locationX);
  await fireEvent(control, "responderGrant", event);
  await fireEvent(
    control,
    "responderRelease",
    gestureEvent(locationX, locationX, 20, [])
  );
};

describe("rating scale", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps null empty while treating zero and negative values as real choices", async () => {
    const onChange = jest.fn<(value: number | null) => void>();

    await render(
      <RatingScale
        animated={false}
        items={sentimentItems}
        onChange={onChange}
        testID="scale"
      />
    );

    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      max: 3,
      min: 0,
      now: 0,
      text: "No selection",
    });

    await tapScale(40);
    expect(onChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 2,
      text: "Neutral",
    });

    await tapScale(5);
    expect(onChange).toHaveBeenLastCalledWith(-1);
  });

  it("does not turn an empty scale into its first choice on decrement", async () => {
    const onChange = jest.fn<(value: number | null) => void>();

    await render(
      <RatingScale
        animated={false}
        items={sentimentItems}
        onChange={onChange}
      />
    );

    const scale = screen.getByRole("adjustable");
    await fireEvent(scale, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(scale).toHaveAccessibilityValue({
      min: 0,
      now: 0,
      text: "No selection",
    });
  });

  it("clears a selected semantic value without conflating it with numeric zero", async () => {
    const onChange = jest.fn<(value: number | null) => void>();

    await render(
      <RatingScale
        allowClear
        animated={false}
        defaultValue={0}
        items={sentimentItems}
        onChange={onChange}
        testID="scale"
      />
    );

    await tapScale(40);
    expect(onChange).toHaveBeenCalledWith(null);

    const scale = screen.getByRole("adjustable");
    await fireEvent(scale, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await fireEvent(scale, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("supports semantic reversal independently of RTL layout", async () => {
    const onChange = jest.fn<(value: number | null) => void>();

    await render(
      <RatingScale
        animated={false}
        direction="rtl"
        items={sentimentItems}
        onChange={onChange}
        renderItem={({ direction, index, value }) => (
          <Text testID={`semantic-${index}`}>{`${direction}:${value}`}</Text>
        )}
        reversed
        testID="scale"
      />
    );

    expect(screen.getByTestId("semantic-2", hidden)).toHaveTextContent("rtl:1");
    expect(screen.getByTestId("scale-item-3", hidden)).toHaveTextContent(
      "rtl:1"
    );

    await tapScale(5);
    expect(onChange).toHaveBeenCalledWith(-1);
  });

  it("supports single and cumulative selection visuals", async () => {
    const view = await render(
      <RatingScale
        animated={false}
        items={sentimentItems}
        renderItem={({ index, selected }) => (
          <Text testID={`selected-${index}`}>{String(selected)}</Text>
        )}
        selectionMode="single"
        testID="scale"
        value={0}
      />
    );

    expect(screen.getByTestId("selected-0", hidden)).toHaveTextContent("false");
    expect(screen.getByTestId("selected-1", hidden)).toHaveTextContent("true");

    await view.rerender(
      <RatingScale
        animated={false}
        items={sentimentItems}
        renderItem={({ index, selected }) => (
          <Text testID={`selected-${index}`}>{String(selected)}</Text>
        )}
        selectionMode="cumulative"
        testID="scale"
        value={0}
      />
    );
    expect(screen.getByTestId("selected-0", hidden)).toHaveTextContent("true");
    expect(screen.getByTestId("selected-1", hidden)).toHaveTextContent("true");
    expect(screen.getByTestId("selected-2", hidden)).toHaveTextContent("false");
  });

  it("supports readable label extents and gives custom renderers visual ownership", async () => {
    const labelItems = [
      { content: null, label: "Strongly disagree", value: "strongly-disagree" },
    ] as const;
    const view = await render(
      <RatingScale
        animated={false}
        itemExtent={140}
        items={labelItems}
        testID="scale"
        value="strongly-disagree"
      />
    );

    expect(screen.getByText("Strongly disagree", hidden)).toBeOnTheScreen();
    expect(screen.getByTestId("scale-item-1", hidden)).toHaveStyle({
      width: 140,
    });

    await view.rerender(
      <RatingScale
        animated={false}
        itemExtent={140}
        items={labelItems}
        renderItem={({ label }) => <Text>{label}</Text>}
        testID="scale"
        value="strongly-disagree"
      />
    );
    expect(screen.getByTestId("scale-item-1", hidden)).not.toHaveStyle({
      borderWidth: 2,
    });
    const control = screen.getByTestId("scale-control", hidden);
    await fireEvent(control, "responderGrant", gestureEvent(10));
    expect(screen.getByTestId("scale-item-1", hidden)).not.toHaveStyle({
      transform: [{ scale: 0.94 }],
    });
    await fireEvent(
      control,
      "responderTerminate",
      gestureEvent(10, 10, 20, [])
    );

    await view.rerender(
      <RatingScale
        animated={false}
        itemExtent={1}
        items={labelItems}
        size={28}
        testID="scale"
        value="strongly-disagree"
      />
    );
    expect(screen.getByTestId("scale-item-1", hidden)).toHaveStyle({
      width: 28,
    });
  });

  it("can hide a read-only scale when adjacent content is equivalent", async () => {
    await render(
      <RatingScale
        decorative
        items={sentimentItems}
        readOnly
        testID="scale"
        value={0}
      />
    );

    const scale = screen.getByTestId("scale", hidden);
    expect(screen.queryByRole("image")).toBeNull();
    expect(scale.props).toMatchObject({
      accessibilityElementsHidden: true,
      accessible: false,
      "aria-hidden": true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  it("uses a local draft for deduplicated semantic dragging", async () => {
    const onChange = jest.fn<(value: number | null) => void>();
    const onChangeEnd =
      jest.fn<NonNullable<RatingScaleProps<number>["onChangeEnd"]>>();
    const onInteractionStart =
      jest.fn<NonNullable<RatingScaleProps<number>["onInteractionStart"]>>();

    await render(
      <RatingScale
        animated={false}
        interactionMode="tap-and-drag"
        items={sentimentItems}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        onInteractionStart={onInteractionStart}
        testID="scale"
        value={-1}
      />
    );
    const control = screen.getByTestId("scale-control", hidden);

    await fireEvent(control, "responderGrant", gestureEvent(5, 105, 50));
    await fireEvent(control, "responderMove", gestureEvent(500, 145, 50));
    await fireEvent(control, "responderMove", gestureEvent(-20, 145, 50));
    await fireEvent(control, "responderMove", gestureEvent(-20, 180, 50));

    expect(onInteractionStart).toHaveBeenCalledWith(-1, {
      source: "pointer",
    });
    expect(onChange.mock.calls).toStrictEqual([[0], [1]]);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 3,
      text: "Positive",
    });

    await fireEvent(
      control,
      "responderRelease",
      gestureEvent(-20, 180, 50, [])
    );
    expect(onChangeEnd).toHaveBeenCalledWith(1, {
      cancelled: false,
      source: "pointer",
    });
  });

  it("normalizes removed, duplicate, and invalid choices permanently", async () => {
    const view = await render(
      <RatingScale<number | string>
        animated={false}
        defaultValue="b"
        items={[
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ]}
        testID="scale"
      />
    );
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 2,
      text: "B",
    });

    await view.rerender(
      <RatingScale<number | string>
        animated={false}
        items={[
          { label: "A", value: "a" },
          { label: "Duplicate", value: "a" },
          { label: "Invalid", value: Number.NaN },
          { label: "   ", value: "blank" },
        ]}
        testID="scale"
      />
    );
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      max: 1,
      now: 0,
      text: "No selection",
    });

    await view.rerender(
      <RatingScale<number | string>
        animated={false}
        items={[
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ]}
        testID="scale"
      />
    );
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      now: 0,
      text: "No selection",
    });
  });

  it("memoizes untouched semantic items during drag previews", async () => {
    const items = Array.from({ length: 100 }, (_, value) => ({
      label: `Choice ${value}`,
      value,
    }));
    const renderItem = jest.fn<
      (props: RatingScaleRenderItemProps<number>) => ReactNode
    >(({ index }) => <Text>{index}</Text>);

    await render(
      <RatingScale
        animated={false}
        interactionMode="tap-and-drag"
        items={items}
        renderItem={renderItem}
        size={10}
        testID="scale"
      />
    );
    const control = screen.getByTestId("scale-control", hidden);

    await fireEvent(control, "responderGrant", gestureEvent(5, 105, 50));
    await fireEvent(control, "responderMove", gestureEvent(25, 125, 50));

    expect(
      renderItem.mock.calls.filter(([props]) => props.index === 99)
    ).toHaveLength(1);
  });

  it("preserves custom item state when semantic values are reordered", async () => {
    const initialItems = [
      { label: "One", value: 1 },
      { label: "Two", value: 2 },
      { label: "Three", value: 3 },
    ] as const;
    const reorderedItems = [
      { label: "Three", value: 3 },
      { label: "Two", value: 2 },
      { label: "One", value: 1 },
    ] as const;
    const view = await render(
      <RatingScale
        animated={false}
        items={initialItems}
        readOnly
        renderItem={renderStatefulScaleItem}
      />
    );
    const before = initialItems.map(({ value }) =>
      String(screen.getByTestId(`stateful-${value}`, hidden).props.children)
    );

    await view.rerender(
      <RatingScale
        animated={false}
        items={reorderedItems}
        readOnly
        renderItem={renderStatefulScaleItem}
      />
    );

    const after = initialItems.map(({ value }) =>
      String(screen.getByTestId(`stateful-${value}`, hidden).props.children)
    );
    expect(after).toStrictEqual(before);
  });

  it("uses a responder-free static path for read-only or empty scales", async () => {
    const subscribe = jest.spyOn(AccessibilityInfo, "addEventListener");
    const timing = jest.spyOn(Animated, "timing");
    const view = await render(
      <RatingScale items={sentimentItems} readOnly testID="scale" value={1} />
    );

    expect(
      screen.getByRole("image", { name: "Rating scale" })
    ).toHaveAccessibilityValue({ text: "Positive" });
    expect(
      screen.getByTestId("scale-control", hidden).props
        .onStartShouldSetResponder
    ).toBeUndefined();
    expect(subscribe).not.toHaveBeenCalled();
    expect(timing).not.toHaveBeenCalled();

    await view.rerender(<RatingScale items={[]} testID="scale" />);
    expect(screen.getByRole("image")).toHaveAccessibilityValue({
      text: "No selection",
    });
  });

  it("stops an in-flight pulse when semantic item order changes", async () => {
    const originalTiming = Animated.timing;
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn<() => void>() });
    jest.spyOn(Animated, "timing").mockImplementation((scale, config) => ({
      ...originalTiming(scale, config),
      start: jest.fn<() => void>(),
      stop: jest.fn<() => void>(),
    }));
    const view = await render(
      <RatingScale items={sentimentItems} testID="scale" />
    );
    await act(async () => {
      await Promise.resolve();
    });

    await tapScale(5);
    const pulseWasVisible = hasTransformStyle(
      screen.getByTestId("scale-item-1", hidden).props.style as unknown
    );

    await view.rerender(
      <RatingScale items={sentimentItems.toReversed()} testID="scale" />
    );
    const pulseWasCleared = !hasTransformStyle(
      screen.getByTestId("scale-item-1", hidden).props.style as unknown
    );
    await view.unmount();
    expect({ pulseWasCleared, pulseWasVisible }).toStrictEqual({
      pulseWasCleared: true,
      pulseWasVisible: true,
    });
  });
});

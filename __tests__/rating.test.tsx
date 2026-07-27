import { describe, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { Text } from "react-native";

import { Rating } from "../src";

describe("rating", () => {
  it("exposes a concise adjustable accessibility control", async () => {
    await render(<Rating animated={false} defaultValue={2} testID="rating" />);

    const rating = screen.getByRole("adjustable", { name: "Rating" });

    expect(rating).toHaveAccessibilityValue({
      max: 5,
      min: 0,
      now: 2,
      text: "2 out of 5",
    });
    expect(screen.getAllByTestId(/rating-item-/u)).toHaveLength(5);
  });

  it("updates an uncontrolled value after a press", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const user = userEvent.setup();

    await render(
      <Rating animated={false} onChange={onChange} testID="rating" />
    );
    await user.press(screen.getByTestId("rating-item-3"));

    expect(onChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 3 });
  });

  it("waits for a controlled parent to update the value", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const user = userEvent.setup();

    const view = await render(
      <Rating animated={false} onChange={onChange} testID="rating" value={1} />
    );
    await user.press(screen.getByTestId("rating-item-4"));

    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });

    await view.rerender(
      <Rating animated={false} onChange={onChange} testID="rating" value={4} />
    );
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 4 });
  });

  it("supports fractional steps and exposes item fill to custom renderers", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        onChange={onChange}
        renderItem={({ fill, index }) => (
          <Text testID={`fill-${index}`}>{fill}</Text>
        )}
        size={40}
        step={0.5}
        testID="rating"
        value={1.5}
      />
    );

    expect(screen.getByTestId("fill-0")).toHaveTextContent("1");
    expect(screen.getByTestId("fill-1")).toHaveTextContent("0.5");
    expect(screen.getByTestId("fill-2")).toHaveTextContent("0");

    await fireEvent.press(screen.getByTestId("rating-item-3"), {
      nativeEvent: { locationX: 8 },
    });
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("keeps non-divisor steps inside the pressed item", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        onChange={onChange}
        size={48}
        step={0.6}
        testID="rating"
        value={0}
      />
    );

    await fireEvent.press(screen.getByTestId("rating-item-1"), {
      nativeEvent: { locationX: 24 },
    });
    await fireEvent.press(screen.getByTestId("rating-item-1"), {
      nativeEvent: { locationX: 48 },
    });

    expect(onChange).toHaveBeenNthCalledWith(1, 0.6);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("uses integer accessibility ticks for fractional values", async () => {
    await render(<Rating animated={false} defaultValue={1.5} step={0.5} />);

    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      max: 10,
      min: 0,
      now: 3,
      text: "1.5 out of 5",
    });
  });

  it("can clear the selected value", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const user = userEvent.setup();

    await render(
      <Rating
        allowClear
        animated={false}
        defaultValue={3}
        onChange={onChange}
        testID="rating"
      />
    );
    await user.press(screen.getByTestId("rating-item-3"));

    expect(onChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 0 });
  });

  it("does not clear from an accessibility increment at the maximum", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        allowClear
        animated={false}
        defaultValue={5}
        onChange={onChange}
        step={0.5}
      />
    );
    const rating = screen.getByRole("adjustable");

    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(rating).toHaveAccessibilityValue({ now: 10 });
  });

  it("ignores touch and accessibility actions while disabled", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const user = userEvent.setup();

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

    await user.press(screen.getByTestId("rating-item-5"));
    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(rating).toBeDisabled();
    expect(rating.props.accessibilityActions).toBeUndefined();
    expect(rating.props.onAccessibilityAction).toBeUndefined();
  });

  it("presents read-only ratings as static content", async () => {
    const onChange = jest.fn<(value: number) => void>();
    const user = userEvent.setup();

    await render(
      <Rating
        animated={false}
        defaultValue={4}
        onChange={onChange}
        readOnly
        testID="rating"
      />
    );

    expect(
      screen.getByRole("image", { name: "Rating" })
    ).toHaveAccessibilityValue({ now: 4 });
    expect(screen.getByTestId("rating-item-2")).toHaveStyle({
      height: 28,
      width: 28,
    });
    await user.press(screen.getByTestId("rating-item-2"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports increment and decrement accessibility actions", async () => {
    const onChange = jest.fn<(value: number) => void>();

    await render(
      <Rating
        animated={false}
        defaultValue={2}
        onChange={onChange}
        step={0.5}
      />
    );
    const rating = screen.getByRole("adjustable");

    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenLastCalledWith(2.5);

    await fireEvent(rating, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("normalizes unsafe runtime values", async () => {
    await render(
      <Rating
        animated={false}
        defaultValue={20}
        max={3.8}
        step={Number.NaN}
        testID="rating"
      />
    );

    expect(screen.getAllByTestId(/rating-item-/u)).toHaveLength(3);
    expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({
      max: 3,
      now: 3,
    });
  });
});

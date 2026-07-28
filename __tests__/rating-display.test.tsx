import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, Text, View } from "react-native";

import { RatingDisplay } from "../src";

const hidden = { includeHiddenElements: true };

describe("rating display", () => {
  it("renders an exact aggregate without quantizing it", async () => {
    await render(
      <RatingDisplay
        renderItem={({ fill, index }) => (
          <Text testID={`display-fill-${index}`}>{fill}</Text>
        )}
        testID="display"
        value={4.37}
      />
    );

    expect(
      screen.getByRole("image", { name: "Rating" })
    ).toHaveAccessibilityValue({ text: "4.37 out of 5" });
    expect(screen.getByTestId("display-fill-3", hidden)).toHaveTextContent("1");
    expect(screen.getByTestId("display-fill-4", hidden)).toHaveTextContent(
      "0.37"
    );
  });

  it("supports opt-in display snapping and vertical RTL renderer metadata", async () => {
    await render(
      <RatingDisplay
        direction="rtl"
        orientation="vertical"
        renderItem={({ fillOrigin, orientation }) => (
          <Text testID="metadata">{`${orientation}:${fillOrigin}`}</Text>
        )}
        step={0.5}
        testID="display"
        value={2.26}
      />
    );

    expect(screen.getAllByText("vertical:bottom", hidden)).toHaveLength(5);
    expect(screen.getByRole("image")).toHaveAccessibilityValue({
      text: "2.5 out of 5",
    });
    expect(screen.getByTestId("display-control", hidden)).toHaveStyle({
      direction: "rtl",
      flexDirection: "column-reverse",
      height: 140,
      width: 28,
    });
  });

  it("can be decorative when adjacent text already announces the value", async () => {
    await render(<RatingDisplay decorative testID="display" value={4.37} />);

    const display = screen.getByTestId("display", hidden);
    expect(screen.queryByRole("image")).toBeNull();
    expect(display.props).toMatchObject({
      accessibilityElementsHidden: true,
      accessible: false,
      "aria-hidden": true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  it("allocates no responders, animations, or motion listeners across a list", async () => {
    const subscribe = jest.spyOn(AccessibilityInfo, "addEventListener");
    const timing = jest.spyOn(Animated, "timing");

    await render(
      <View>
        {Array.from({ length: 100 }, (_, index) => (
          <RatingDisplay
            key={index}
            max={5}
            testID={`display-${index}`}
            value={(index % 50) / 10}
          />
        ))}
      </View>
    );

    expect(
      screen.getAllByRole("image", { includeHiddenElements: true })
    ).toHaveLength(100);
    expect(
      screen.getByTestId("display-50-control", hidden).props
        .onStartShouldSetResponder
    ).toBeUndefined();
    expect(subscribe).not.toHaveBeenCalled();
    expect(timing).not.toHaveBeenCalled();
  });

  it("clamps invalid values and dimensions safely", async () => {
    await render(
      <RatingDisplay
        gap={Number.NaN}
        max={Number.POSITIVE_INFINITY}
        size={-2}
        testID="display"
        value={Number.NaN}
      />
    );

    expect(screen.getByRole("image")).toHaveAccessibilityValue({
      text: "0 out of 5",
    });
    expect(screen.getAllByTestId(/display-item-/u, hidden)).toHaveLength(5);
    expect(screen.getByTestId("display-item-1", hidden)).toHaveStyle({
      height: 28,
      width: 28,
    });
  });
});

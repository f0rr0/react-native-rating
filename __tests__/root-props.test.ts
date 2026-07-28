import { describe, expect, it, jest } from "@jest/globals";

import { getForwardedRatingRootProps } from "../src/internal/root-props";

describe("rating root props", () => {
  it("preserves the common safe-props object by identity", () => {
    const safeProps = {
      onFocus: jest.fn(),
      style: { opacity: 0.8 },
      testID: "rating",
    };

    expect(getForwardedRatingRootProps(safeProps)).toBe(safeProps);
  });

  it("strips owned semantics and responders from broad runtime spreads", () => {
    const safeFocus = jest.fn();
    const hostileProps = {
      accessible: false,
      "aria-hidden": true,
      onFocus: safeFocus,
      onKeyDown: jest.fn(),
      onKeyDownCapture: jest.fn(),
      onStartShouldSetResponderCapture: jest.fn(() => true),
      pointerEvents: "none" as const,
      testID: "rating",
    };

    expect(getForwardedRatingRootProps(hostileProps)).toStrictEqual({
      onFocus: safeFocus,
      testID: "rating",
    });
  });
});

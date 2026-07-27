import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentRef, ReactNode, Ref } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  I18nManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
} from "react-native";
import type {
  AccessibilityActionEvent,
  ColorValue,
  GestureResponderEvent,
  ViewProps,
} from "react-native";

const DEFAULT_ACTIVE_COLOR = "#E8A317";
const DEFAULT_INACTIVE_COLOR = "#D5D9E0";
const DEFAULT_MAX = 5;
const DEFAULT_SIZE = 28;
const MAX_ITEMS = 100;
const MIN_STEP = 0.01;
const PRESS_TARGET_SIZE = Platform.select({ default: 48, ios: 44 });
const ACCESSIBILITY_ACTIONS = [
  { name: "increment" as const },
  { name: "decrement" as const },
];
const defaultFormatAccessibilityValue = (value: number, max: number) =>
  `${value} out of ${max}`;

type RatingRootProps = Omit<
  ViewProps,
  | "accessibilityActions"
  | "accessibilityRole"
  | "accessibilityState"
  | "accessibilityValue"
  | "children"
  | "onAccessibilityAction"
>;

export interface RatingRenderItemProps {
  activeColor: ColorValue;
  disabled: boolean;
  fill: number;
  inactiveColor: ColorValue;
  index: number;
  pressed: boolean;
  size: number;
  value: number;
}

export type RatingRenderItem = (props: RatingRenderItemProps) => ReactNode;

export interface RatingProps extends RatingRootProps {
  /**
   * Lets a parent own the current rating. Pair it with `onChange`.
   */
  value?: number;
  /**
   * Initial value when the component is uncontrolled.
   */
  defaultValue?: number;
  /**
   * Number of rating items. Values outside 1–100 are clamped.
   * @default 5
   */
  max?: number;
  /**
   * Selection precision. Values outside 0.01–1 are clamped.
   * @default 1
   */
  step?: number;
  /**
   * Called when a user selects a different value.
   */
  onChange?: (value: number) => void;
  /**
   * Clears the rating when its current value is selected again.
   * @default false
   */
  allowClear?: boolean;
  /**
   * Prevents interaction and exposes a disabled accessibility state.
   * @default false
   */
  disabled?: boolean;
  /**
   * Presents the rating as static content rather than an input.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Size of the visible item. Interactive targets remain at least 44pt/48dp.
   * @default 28
   */
  size?: number;
  /**
   * Space between item touch targets.
   * @default 0
   */
  gap?: number;
  /**
   * Color of the selected portion.
   * @default "#E8A317"
   */
  activeColor?: ColorValue;
  /**
   * Color of the unselected portion.
   * @default "#D5D9E0"
   */
  inactiveColor?: ColorValue;
  /**
   * Enables a quiet selection animation. System reduced-motion settings win.
   * @default true
   */
  animated?: boolean;
  /**
   * Formats the text announced with the accessibility value.
   */
  formatAccessibilityValue?: (value: number, max: number) => string;
  /**
   * Replaces the default text star without adding a runtime icon dependency.
   */
  renderItem?: RatingRenderItem;
  /**
   * React 19 ref for the root native View.
   */
  ref?: Ref<ComponentRef<typeof View>>;
}

interface RatingItemProps {
  activeColor: ColorValue;
  animated: boolean;
  disabled: boolean;
  fill: number;
  inactiveColor: ColorValue;
  index: number;
  onPress: (index: number, event: GestureResponderEvent) => void;
  readOnly: boolean;
  reduceMotion: boolean;
  renderItem?: RatingRenderItem | undefined;
  size: number;
  targetSize: number;
  testID?: string | undefined;
}

interface DefaultRatingIconProps {
  activeColor: ColorValue;
  fill: number;
  inactiveColor: ColorValue;
  size: number;
}

const styles = StyleSheet.create({
  activeStar: {
    position: "absolute",
    top: 0,
  },
  activeStarLeft: {
    left: 0,
  },
  activeStarRight: {
    right: 0,
  },
  animatedItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  fillMask: {
    overflow: "hidden",
    position: "absolute",
    top: 0,
  },
  fillMaskLeft: {
    left: 0,
  },
  fillMaskRight: {
    right: 0,
  },
  icon: {
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  root: {
    alignItems: "center",
  },
  rootLeftToRight: {
    flexDirection: "row",
  },
  rootRightToLeft: {
    flexDirection: "row-reverse",
  },
  star: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
});

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

const normalizeMax = (max: number): number => {
  if (!Number.isFinite(max)) {
    return DEFAULT_MAX;
  }

  return clamp(Math.trunc(max), 1, MAX_ITEMS);
};

const normalizePositive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const normalizeStep = (step: number): number =>
  Number.isFinite(step) ? clamp(step, MIN_STEP, 1) : 1;

const roundValue = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

const getTicksPerItem = (step: number): number => Math.ceil(1 / step);

const getValueFromTick = (tick: number, max: number, step: number): number => {
  const ticksPerItem = getTicksPerItem(step);
  const safeTick = clamp(Math.trunc(tick), 0, max * ticksPerItem);
  const fullItems = Math.floor(safeTick / ticksPerItem);
  const partialTick = safeTick % ticksPerItem;

  if (partialTick === 0) {
    return fullItems;
  }

  return roundValue(Math.min(max, fullItems + Math.min(partialTick * step, 1)));
};

const getClosestTick = (value: number, max: number, step: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const safeValue = clamp(value, 0, max);
  const ticksPerItem = getTicksPerItem(step);
  const fullItems = Math.floor(safeValue);

  if (fullItems >= max) {
    return max * ticksPerItem;
  }

  const fraction = safeValue - fullItems;
  const regularTick = clamp(Math.round(fraction / step), 0, ticksPerItem - 1);
  const regularFraction = regularTick * step;
  const useItemEnd = 1 - fraction <= Math.abs(regularFraction - fraction);

  return useItemEnd
    ? (fullItems + 1) * ticksPerItem
    : fullItems * ticksPerItem + regularTick;
};

const normalizeValue = (value: number, max: number, step: number): number => {
  const tick = getClosestTick(value, max, step);
  return getValueFromTick(tick, max, step);
};

const getPressedValue = (
  index: number,
  event: GestureResponderEvent,
  step: number,
  targetSize: number
): number => {
  const position = event.nativeEvent.locationX;
  const physicalFraction = Number.isFinite(position)
    ? clamp(position / targetSize, 0, 1)
    : 1;
  const logicalFraction = I18nManager.isRTL
    ? 1 - physicalFraction
    : physicalFraction;
  const ticksPerItem = getTicksPerItem(step);
  const partialTick = clamp(
    Math.max(1, Math.ceil(logicalFraction / step)),
    1,
    ticksPerItem
  );

  return partialTick === ticksPerItem
    ? index + 1
    : roundValue(index + partialTick * step);
};

const useReducedMotion = (): boolean => {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    const readPreference = async () => {
      const preference = await AccessibilityInfo.isReduceMotionEnabled();

      if (mounted) {
        setReduceMotion(preference);
      }
    };

    void readPreference();

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
};

const DefaultRatingIcon = ({
  activeColor,
  fill,
  inactiveColor,
  size,
}: DefaultRatingIconProps) => {
  const textStyle = [
    styles.star,
    {
      color: inactiveColor,
      fontSize: size,
      height: size,
      lineHeight: size,
      width: size,
    },
  ];
  const activeTextStyle = [
    textStyle,
    styles.activeStar,
    I18nManager.isRTL ? styles.activeStarRight : styles.activeStarLeft,
    { color: activeColor },
  ];

  return (
    <View
      pointerEvents="none"
      style={[styles.icon, { height: size, width: size }]}
    >
      <Text allowFontScaling={false} selectable={false} style={textStyle}>
        ★
      </Text>
      <View
        style={[
          styles.fillMask,
          I18nManager.isRTL ? styles.fillMaskRight : styles.fillMaskLeft,
          { height: size, width: size * fill },
        ]}
      >
        <Text
          allowFontScaling={false}
          selectable={false}
          style={activeTextStyle}
        >
          ★
        </Text>
      </View>
    </View>
  );
};

const RatingItem = ({
  activeColor,
  animated,
  disabled,
  fill,
  inactiveColor,
  index,
  onPress,
  readOnly,
  reduceMotion,
  renderItem,
  size,
  targetSize,
  testID,
}: RatingItemProps) => {
  const scale = useAnimatedValue(1);
  const previousFill = useRef(fill);

  useEffect(() => {
    const shouldAnimate =
      animated && !reduceMotion && fill > previousFill.current;
    previousFill.current = fill;
    scale.stopAnimation();

    if (!shouldAnimate) {
      scale.setValue(1);
      return () => {
        scale.stopAnimation();
      };
    }

    scale.setValue(0.88);
    const animation = Animated.timing(scale, {
      duration: 160,
      easing: Easing.out((time) => Easing.cubic(time)),
      isInteraction: false,
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animated, fill, reduceMotion, scale]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress(index, event);
    },
    [index, onPress]
  );

  return (
    <Pressable
      accessible={false}
      disabled={disabled || readOnly}
      onPress={handlePress}
      style={[styles.item, { height: targetSize, width: targetSize }]}
      testID={testID}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.animatedItem,
            {
              opacity: pressed ? 0.62 : 1,
              transform: [{ scale }],
            },
          ]}
        >
          {renderItem ? (
            renderItem({
              activeColor,
              disabled,
              fill,
              inactiveColor,
              index,
              pressed,
              size,
              value: index + 1,
            })
          ) : (
            <DefaultRatingIcon
              activeColor={activeColor}
              fill={fill}
              inactiveColor={inactiveColor}
              size={size}
            />
          )}
        </Animated.View>
      )}
    </Pressable>
  );
};

export const Rating = ({
  accessibilityLabel = "Rating",
  activeColor = DEFAULT_ACTIVE_COLOR,
  allowClear = false,
  animated = true,
  defaultValue = 0,
  disabled = false,
  formatAccessibilityValue = defaultFormatAccessibilityValue,
  gap = 0,
  inactiveColor = DEFAULT_INACTIVE_COLOR,
  max = DEFAULT_MAX,
  onChange,
  readOnly = false,
  ref,
  renderItem,
  size = DEFAULT_SIZE,
  step = 1,
  style,
  testID,
  value,
  ...viewProps
}: RatingProps) => {
  const safeMax = normalizeMax(max);
  const safeStep = normalizeStep(step);
  const safeSize = normalizePositive(size, DEFAULT_SIZE);
  const safeGap = Math.max(0, Number.isFinite(gap) ? gap : 0);
  const targetSize = readOnly
    ? safeSize
    : Math.max(safeSize, PRESS_TARGET_SIZE);
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeValue(defaultValue, safeMax, safeStep)
  );
  const currentValue = normalizeValue(
    controlled ? value : uncontrolledValue,
    safeMax,
    safeStep
  );
  const ticksPerItem = getTicksPerItem(safeStep);
  const currentTick = getClosestTick(currentValue, safeMax, safeStep);
  const interactive = !disabled && !readOnly;
  const reduceMotion = useReducedMotion();

  const updateValue = useCallback(
    (candidate: number) => {
      const nextValue = normalizeValue(candidate, safeMax, safeStep);

      if (nextValue === currentValue) {
        return;
      }

      if (!controlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [controlled, currentValue, onChange, safeMax, safeStep]
  );

  const handleItemPress = useCallback(
    (index: number, event: GestureResponderEvent) => {
      const pressedValue = normalizeValue(
        getPressedValue(index, event, safeStep, targetSize),
        safeMax,
        safeStep
      );

      updateValue(
        allowClear && pressedValue === currentValue ? 0 : pressedValue
      );
    },
    [allowClear, currentValue, safeMax, safeStep, targetSize, updateValue]
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (disabled || readOnly) {
        return;
      }

      if (event.nativeEvent.actionName === "increment") {
        updateValue(getValueFromTick(currentTick + 1, safeMax, safeStep));
      } else if (event.nativeEvent.actionName === "decrement") {
        updateValue(getValueFromTick(currentTick - 1, safeMax, safeStep));
      }
    },
    [currentTick, disabled, readOnly, safeMax, safeStep, updateValue]
  );

  return (
    <View
      {...viewProps}
      accessibilityActions={interactive ? ACCESSIBILITY_ACTIONS : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={readOnly ? "image" : "adjustable"}
      accessibilityState={{ disabled }}
      accessibilityValue={{
        max: safeMax * ticksPerItem,
        min: 0,
        now: currentTick,
        text: formatAccessibilityValue(currentValue, safeMax),
      }}
      accessible
      onAccessibilityAction={
        interactive ? handleAccessibilityAction : undefined
      }
      ref={ref ?? null}
      style={[
        styles.root,
        I18nManager.isRTL ? styles.rootRightToLeft : styles.rootLeftToRight,
        { columnGap: safeGap, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
      testID={testID}
    >
      {Array.from({ length: safeMax }, (_, index) => {
        const fill = clamp(currentValue - index, 0, 1);

        return (
          <RatingItem
            activeColor={activeColor}
            animated={animated}
            disabled={disabled}
            fill={fill}
            inactiveColor={inactiveColor}
            index={index}
            key={index}
            onPress={handleItemPress}
            readOnly={readOnly}
            reduceMotion={reduceMotion}
            renderItem={renderItem}
            size={safeSize}
            targetSize={targetSize}
            testID={
              testID === undefined ? undefined : `${testID}-item-${index + 1}`
            }
          />
        );
      })}
    </View>
  );
};

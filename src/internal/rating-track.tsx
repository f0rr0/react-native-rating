import { memo } from "react";
import type { ReactNode } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import type { ColorValue, ViewProps, ViewStyle } from "react-native";

import type {
  RatingInteractionMode,
  RatingOrientation,
  RatingRenderItem,
  RatingScaleItem,
  RatingScaleRenderItem,
  RatingScaleSelectionMode,
  RatingScaleValue,
  ResolvedRatingDirection,
} from "../types";
import { getFillOrigin, getItemFill, getTrackExtent } from "./model";
import type { NumericRatingModel } from "./model";

export const DEFAULT_ACTIVE_COLOR = "#B45309";
export const DEFAULT_INACTIVE_COLOR = "#6B7280";

const styles = StyleSheet.create({
  activeStar: {
    position: "absolute",
    start: 0,
  },
  animatedItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  fillMask: {
    overflow: "hidden",
    position: "absolute",
    start: 0,
  },
  icon: {
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  scaleSelected: {
    borderRadius: 999,
    borderWidth: 2,
  },
  scaleText: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
  star: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
  track: {
    alignItems: "center",
    justifyContent: "center",
  },
  webTrackBoxOnly: {
    pointerEvents: "box-only",
  },
  webTrackNone: {
    pointerEvents: "none",
  },
});

interface RatingTrackFrameProps {
  children: ReactNode;
  direction: ResolvedRatingDirection;
  gap: number;
  handlers?: ViewProps | undefined;
  interactionMode?: RatingInteractionMode | undefined;
  interactive: boolean;
  itemCount: number;
  itemSize: number;
  orientation: RatingOrientation;
  targetSize: number;
  testID?: string | undefined;
}

interface DefaultRatingIconProps {
  activeColor: ColorValue;
  direction: ResolvedRatingDirection;
  fill: number;
  inactiveColor: ColorValue;
  orientation: RatingOrientation;
  size: number;
}

interface NumericRatingItemProps {
  activeColor: ColorValue;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  fill: number;
  inactiveColor: ColorValue;
  index: number;
  itemSize: number;
  orientation: RatingOrientation;
  pressed: boolean;
  pulseScale: Animated.Value | null;
  renderItem: RatingRenderItem | undefined;
  targetSize: number;
  testID: string | undefined;
}

interface NumericRatingItemsProps {
  activeColor: ColorValue;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  inactiveColor: ColorValue;
  itemSize: number;
  model: NumericRatingModel;
  orientation: RatingOrientation;
  pressedTick: number | null;
  pulseIndex: number | null;
  pulseScale: Animated.Value | null;
  renderItem: RatingRenderItem | undefined;
  targetSize: number;
  testID: string | undefined;
  value: number;
}

interface ScaleRatingItemProps<Value extends RatingScaleValue> {
  activeColor: ColorValue;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  inactiveColor: ColorValue;
  index: number;
  item: RatingScaleItem<Value>;
  itemExtent: number;
  itemSize: number;
  orientation: RatingOrientation;
  pressed: boolean;
  pulseScale: Animated.Value | null;
  renderItem: RatingScaleRenderItem<Value> | undefined;
  selected: boolean;
  targetSize: number;
  testID: string | undefined;
}

interface ScaleRatingItemsProps<Value extends RatingScaleValue> {
  activeColor: ColorValue;
  direction: ResolvedRatingDirection;
  disabled: boolean;
  inactiveColor: ColorValue;
  itemExtent: number;
  itemSize: number;
  items: readonly RatingScaleItem<Value>[];
  orientation: RatingOrientation;
  pressedTick: number | null;
  pulseIndex: number | null;
  pulseScale: Animated.Value | null;
  renderItem: RatingScaleRenderItem<Value> | undefined;
  reversed: boolean;
  selectedTick: number;
  selectionMode: RatingScaleSelectionMode;
  targetSize: number;
  testID: string | undefined;
}

interface WebTrackStyle extends ViewStyle {
  touchAction?: "pan-x" | "pan-y";
  userSelect: "none";
}

const getItemDimensions = (
  orientation: RatingOrientation,
  itemSize: number,
  targetSize: number
): ViewStyle =>
  orientation === "horizontal"
    ? { height: targetSize, width: itemSize }
    : { height: itemSize, width: targetSize };

const getWebTrackStyle = (
  interactive: boolean,
  interactionMode: RatingInteractionMode | undefined,
  orientation: RatingOrientation
): WebTrackStyle | undefined => {
  if (Platform.OS !== "web") {
    return undefined;
  }

  const style: WebTrackStyle = { userSelect: "none" };

  if (interactive && interactionMode === "tap-and-drag") {
    style.touchAction = orientation === "horizontal" ? "pan-y" : "pan-x";
  }

  return style;
};

export const RatingTrackFrame = ({
  children,
  direction,
  gap,
  handlers,
  interactionMode,
  interactive,
  itemCount,
  itemSize,
  orientation,
  targetSize,
  testID,
}: RatingTrackFrameProps) => {
  const extent = getTrackExtent(itemCount, itemSize, gap);
  const dimensions =
    orientation === "horizontal"
      ? { height: targetSize, width: extent }
      : { height: extent, width: targetSize };
  const layout =
    orientation === "horizontal"
      ? { columnGap: gap, flexDirection: "row" as const }
      : { flexDirection: "column-reverse" as const, rowGap: gap };
  let nativePointerEvents: ViewProps["pointerEvents"];

  if (Platform.OS !== "web") {
    nativePointerEvents = interactive ? "box-only" : "none";
  }

  let webPointerStyle: ViewProps["style"];

  if (Platform.OS === "web") {
    webPointerStyle = interactive
      ? styles.webTrackBoxOnly
      : styles.webTrackNone;
  }

  return (
    <View
      {...handlers}
      accessibilityElementsHidden
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents={nativePointerEvents}
      style={[
        styles.track,
        dimensions,
        layout,
        { direction },
        webPointerStyle,
        getWebTrackStyle(interactive, interactionMode, orientation),
      ]}
      testID={testID === undefined ? undefined : `${testID}-control`}
    >
      {children}
    </View>
  );
};

const DefaultRatingIcon = ({
  activeColor,
  direction,
  fill,
  inactiveColor,
  orientation,
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
  const maskSize =
    orientation === "horizontal"
      ? { height: size, width: size * fill }
      : { height: size * fill, width: size };
  const maskOrigin = orientation === "vertical" ? { bottom: 0 } : { top: 0 };
  const wholeIcon = fill === 0 || fill === 1;

  return (
    <View style={[styles.icon, { direction, height: size, width: size }]}>
      {wholeIcon ? (
        <Text
          allowFontScaling={false}
          selectable={false}
          style={[
            textStyle,
            { color: fill === 1 ? activeColor : inactiveColor },
          ]}
        >
          {fill === 1 ? "★" : "☆"}
        </Text>
      ) : (
        <>
          <Text allowFontScaling={false} selectable={false} style={textStyle}>
            ☆
          </Text>
          <View style={[styles.fillMask, maskOrigin, maskSize]}>
            <Text
              allowFontScaling={false}
              selectable={false}
              style={[
                textStyle,
                styles.activeStar,
                maskOrigin,
                { color: activeColor },
              ]}
            >
              ★
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const NumericRatingItem = ({
  activeColor,
  direction,
  disabled,
  fill,
  inactiveColor,
  index,
  itemSize,
  orientation,
  pressed,
  pulseScale,
  renderItem,
  targetSize,
  testID,
}: NumericRatingItemProps) => {
  const content = renderItem ? (
    renderItem({
      activeColor,
      direction,
      disabled,
      fill,
      fillOrigin: getFillOrigin(orientation, direction),
      inactiveColor,
      index,
      orientation,
      pressed,
      size: itemSize,
      value: index + 1,
    })
  ) : (
    <DefaultRatingIcon
      activeColor={activeColor}
      direction={direction}
      fill={fill}
      inactiveColor={inactiveColor}
      orientation={orientation}
      size={itemSize}
    />
  );
  const itemStyle = [
    styles.item,
    getItemDimensions(orientation, itemSize, targetSize),
    pressed && renderItem === undefined ? styles.pressed : undefined,
  ];

  if (pulseScale !== null) {
    return (
      <Animated.View
        style={[
          itemStyle,
          styles.animatedItem,
          { transform: [{ scale: pulseScale }] },
        ]}
        testID={testID}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <View style={itemStyle} testID={testID}>
      {content}
    </View>
  );
};

const MemoNumericRatingItem = memo(NumericRatingItem);

export const NumericRatingItems = ({
  activeColor,
  direction,
  disabled,
  inactiveColor,
  itemSize,
  model,
  orientation,
  pressedTick,
  pulseIndex,
  pulseScale,
  renderItem,
  targetSize,
  testID,
  value,
}: NumericRatingItemsProps) =>
  Array.from({ length: model.max }, (_, index) => {
    const pressedIndex =
      pressedTick === null || pressedTick <= 0
        ? -1
        : Math.ceil(pressedTick / model.ticksPerItem) - 1;

    return (
      <MemoNumericRatingItem
        activeColor={activeColor}
        direction={direction}
        disabled={disabled}
        fill={getItemFill(value, index)}
        inactiveColor={inactiveColor}
        index={index}
        itemSize={itemSize}
        key={index}
        orientation={orientation}
        pressed={pressedIndex === index}
        pulseScale={pulseIndex === index ? pulseScale : null}
        renderItem={renderItem}
        targetSize={targetSize}
        testID={
          testID === undefined ? undefined : `${testID}-item-${index + 1}`
        }
      />
    );
  });

const getScaleContent = (
  content: ReactNode | undefined,
  label: string,
  color: ColorValue,
  extent: number,
  size: number,
  orientation: RatingOrientation,
  selected: boolean
): ReactNode => {
  const hasContent =
    content !== undefined && content !== null && typeof content !== "boolean";

  if (
    !hasContent ||
    typeof content === "number" ||
    typeof content === "string"
  ) {
    return (
      <Text
        adjustsFontSizeToFit
        allowFontScaling
        ellipsizeMode="tail"
        minimumFontScale={0.75}
        numberOfLines={1}
        selectable={false}
        style={[
          styles.scaleText,
          {
            color,
            fontSize: Math.max(12, size * 0.52),
            fontWeight: selected ? "700" : "500",
            lineHeight: size,
            width: orientation === "horizontal" ? extent : size,
          },
        ]}
      >
        {hasContent ? content : label}
      </Text>
    );
  }

  return content;
};

const ScaleRatingItem = <Value extends RatingScaleValue>({
  activeColor,
  direction,
  disabled,
  inactiveColor,
  index,
  item,
  itemExtent,
  itemSize,
  orientation,
  pressed,
  pulseScale,
  renderItem,
  selected,
  targetSize,
  testID,
}: ScaleRatingItemProps<Value>) => {
  const content = renderItem
    ? renderItem({
        activeColor,
        content: item.content,
        direction,
        disabled,
        inactiveColor,
        index,
        itemExtent,
        label: item.label,
        orientation,
        pressed,
        selected,
        size: itemSize,
        value: item.value,
      })
    : getScaleContent(
        item.content,
        item.label,
        selected ? activeColor : inactiveColor,
        itemExtent,
        itemSize,
        orientation,
        selected
      );
  const itemStyle = [
    styles.item,
    getItemDimensions(orientation, itemExtent, targetSize),
    pressed && renderItem === undefined ? styles.pressed : undefined,
    selected && renderItem === undefined
      ? [styles.scaleSelected, { borderColor: activeColor }]
      : undefined,
  ];

  if (pulseScale !== null) {
    return (
      <Animated.View
        style={[
          itemStyle,
          styles.animatedItem,
          { transform: [{ scale: pulseScale }] },
        ]}
        testID={testID}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <View style={itemStyle} testID={testID}>
      {content}
    </View>
  );
};

// React.memo preserves these props at runtime but its declarations erase the
// generic relationship between each scale item and its render callback.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const MemoScaleRatingItem = memo(ScaleRatingItem) as typeof ScaleRatingItem;

export const ScaleRatingItems = <Value extends RatingScaleValue>({
  activeColor,
  direction,
  disabled,
  inactiveColor,
  itemExtent,
  itemSize,
  items,
  orientation,
  pressedTick,
  pulseIndex,
  pulseScale,
  renderItem,
  reversed,
  selectedTick,
  selectionMode,
  targetSize,
  testID,
}: ScaleRatingItemsProps<Value>) =>
  Array.from({ length: items.length }, (_, visualIndex) => {
    const index = reversed ? items.length - 1 - visualIndex : visualIndex;
    const item = items[index];

    if (item === undefined) {
      return null;
    }

    const itemTick = reversed ? items.length - index : index + 1;
    const selected =
      selectionMode === "cumulative"
        ? selectedTick > 0 && itemTick <= selectedTick
        : itemTick === selectedTick;

    return (
      <MemoScaleRatingItem
        activeColor={activeColor}
        direction={direction}
        disabled={disabled}
        inactiveColor={inactiveColor}
        index={index}
        item={item}
        itemExtent={itemExtent}
        itemSize={itemSize}
        key={`${typeof item.value}:${String(item.value)}`}
        orientation={orientation}
        pressed={pressedTick === itemTick}
        pulseScale={pulseIndex === index ? pulseScale : null}
        renderItem={renderItem}
        selected={selected}
        targetSize={targetSize}
        testID={
          testID === undefined ? undefined : `${testID}-item-${index + 1}`
        }
      />
    );
  });

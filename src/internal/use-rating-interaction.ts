import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  ViewProps,
} from "react-native";

import type {
  RatingInteractionDetails,
  RatingInteractionEndDetails,
  RatingInteractionMode,
  RatingInteractionSource,
  RatingOrientation,
} from "../types";
import { getDecrementTick, getHomeTick, getIncrementTick } from "./model";

const TOUCH_SLOP = 7;
const AXIS_DOMINANCE_RATIO = 1.25;

const POINTER_DETAILS: RatingInteractionDetails = Object.freeze({
  source: "pointer",
});
const KEYBOARD_DETAILS: RatingInteractionDetails = Object.freeze({
  source: "keyboard",
});
const ACCESSIBILITY_DETAILS: RatingInteractionDetails = Object.freeze({
  source: "accessibility",
});

type GesturePhase =
  | "cancelled"
  | "committing"
  | "dragging"
  | "idle"
  | "pressed";

interface GestureState<Value> {
  getValue: ((tick: number) => Value) | null;
  lastEmittedTick: number;
  lastTick: number;
  origin: number;
  phase: GesturePhase;
  startCrossAxis: number;
  startPrimaryAxis: number;
  startTick: number;
}

interface InteractionVisualState {
  active: boolean;
  dragging: boolean;
  tick: number | null;
}

interface RatingKeyboardEvent {
  altKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  key?: string | undefined;
  metaKey?: boolean | undefined;
  nativeEvent?:
    | {
        altKey?: boolean | undefined;
        ctrlKey?: boolean | undefined;
        key?: string | undefined;
        metaKey?: boolean | undefined;
      }
    | undefined;
  preventDefault?: (() => void) | undefined;
  stopPropagation?: (() => void) | undefined;
}

interface UseRatingInteractionOptions<Value> {
  allowClear: boolean;
  currentTick: number;
  defaultExtent: number;
  disabled: boolean;
  getValue: (tick: number) => Value;
  interactionMode: RatingInteractionMode;
  maxTick: number;
  minTick: number;
  onChangeEnd:
    | ((value: Value, details: RatingInteractionEndDetails) => void)
    | undefined;
  onChangeTick: (tick: number) => void;
  onComplete: (tick: number, source: RatingInteractionSource) => void;
  onInteractionStart:
    | ((value: Value, details: RatingInteractionDetails) => void)
    | undefined;
  orientation: RatingOrientation;
  positionToTick: (position: number, extent: number) => number;
  structure: readonly unknown[];
}

type RatingTrackHandlers = Pick<
  ViewProps,
  | "onLayout"
  | "onResponderEnd"
  | "onResponderGrant"
  | "onResponderMove"
  | "onResponderRelease"
  | "onResponderStart"
  | "onResponderTerminate"
  | "onResponderTerminationRequest"
  | "onStartShouldSetResponder"
>;

interface UseRatingInteractionResult {
  active: boolean;
  dragging: boolean;
  draftTick: number | null;
  handleAccessibilityAction: (event: AccessibilityActionEvent) => void;
  handleKeyDown: (event: RatingKeyboardEvent) => void;
  trackHandlers: RatingTrackHandlers;
}

const createIdleGesture = <Value>(): GestureState<Value> => ({
  getValue: null,
  lastEmittedTick: 0,
  lastTick: 0,
  origin: 0,
  phase: "idle",
  startCrossAxis: 0,
  startPrimaryAxis: 0,
  startTick: 0,
});

const areStructuresEqual = (
  first: readonly unknown[],
  second: readonly unknown[]
): boolean =>
  first.length === second.length &&
  first.every((value, index) => Object.is(value, second[index]));

const getAxisCoordinates = (
  event: GestureResponderEvent,
  orientation: RatingOrientation
): {
  crossAxis: number;
  location: number;
  page: number;
} => {
  const { nativeEvent } = event;
  const horizontal = orientation === "horizontal";
  const location = horizontal ? nativeEvent.locationX : nativeEvent.locationY;
  const crossLocation = horizontal
    ? nativeEvent.locationY
    : nativeEvent.locationX;
  const rawPage = horizontal ? nativeEvent.pageX : nativeEvent.pageY;
  const rawCrossPage = horizontal ? nativeEvent.pageY : nativeEvent.pageX;
  const safeLocation = Number.isFinite(location) ? location : 0;
  const safeCrossLocation = Number.isFinite(crossLocation) ? crossLocation : 0;

  return {
    crossAxis: Number.isFinite(rawCrossPage) ? rawCrossPage : safeCrossLocation,
    location: safeLocation,
    page: Number.isFinite(rawPage) ? rawPage : safeLocation,
  };
};

const getTouchCount = (event?: GestureResponderEvent): number => {
  const touches = event?.nativeEvent.touches;
  return Array.isArray(touches) ? touches.length : 1;
};

const getDetails = (
  source: RatingInteractionSource
): RatingInteractionDetails => {
  if (source === "accessibility") {
    return ACCESSIBILITY_DETAILS;
  }

  return source === "keyboard" ? KEYBOARD_DETAILS : POINTER_DETAILS;
};

export const useRatingInteraction = <Value>({
  allowClear,
  currentTick,
  defaultExtent,
  disabled,
  getValue,
  interactionMode,
  maxTick,
  minTick,
  onChangeEnd,
  onChangeTick,
  onComplete,
  onInteractionStart,
  orientation,
  positionToTick,
  structure,
}: UseRatingInteractionOptions<Value>): UseRatingInteractionResult => {
  const latest = useRef<UseRatingInteractionOptions<Value>>({
    allowClear,
    currentTick,
    defaultExtent,
    disabled,
    getValue,
    interactionMode,
    maxTick,
    minTick,
    onChangeEnd,
    onChangeTick,
    onComplete,
    onInteractionStart,
    orientation,
    positionToTick,
    structure,
  });
  useLayoutEffect(() => {
    latest.current = {
      allowClear,
      currentTick,
      defaultExtent,
      disabled,
      getValue,
      interactionMode,
      maxTick,
      minTick,
      onChangeEnd,
      onChangeTick,
      onComplete,
      onInteractionStart,
      orientation,
      positionToTick,
      structure,
    };
  }, [
    allowClear,
    currentTick,
    defaultExtent,
    disabled,
    getValue,
    interactionMode,
    maxTick,
    minTick,
    onChangeEnd,
    onChangeTick,
    onComplete,
    onInteractionStart,
    orientation,
    positionToTick,
    structure,
  ]);

  const extent = useRef(defaultExtent);
  useLayoutEffect(() => {
    extent.current = defaultExtent;
  }, [defaultExtent]);

  const gesture = useRef<GestureState<Value>>(createIdleGesture());
  const mounted = useRef(true);
  const visual = useRef<InteractionVisualState>({
    active: false,
    dragging: false,
    tick: null,
  });
  const [visualState, setVisualState] = useState<InteractionVisualState>({
    active: false,
    dragging: false,
    tick: null,
  });

  const updateVisual = useCallback((next: InteractionVisualState): void => {
    const previous = visual.current;

    if (
      previous.active === next.active &&
      previous.dragging === next.dragging &&
      previous.tick === next.tick
    ) {
      return;
    }

    visual.current = next;
    setVisualState(next);
  }, []);

  const resetInteraction = useCallback((): void => {
    gesture.current = createIdleGesture();
    updateVisual({ active: false, dragging: false, tick: null });
  }, [updateVisual]);

  const isCurrentGesture = useCallback(
    (
      candidate: GestureState<Value>,
      phase: "committing" | "dragging"
    ): boolean =>
      mounted.current &&
      gesture.current === candidate &&
      candidate.phase === phase,
    []
  );

  const emitTick = useCallback((tick: number): void => {
    const currentGesture = gesture.current;

    if (currentGesture.lastEmittedTick === tick) {
      currentGesture.lastTick = tick;
      return;
    }

    currentGesture.lastEmittedTick = tick;
    currentGesture.lastTick = tick;
    latest.current.onChangeTick(tick);
  }, []);

  const beginInteraction = useCallback(
    (
      source: RatingInteractionSource,
      tick: number,
      valueFromTick: (tick: number) => Value = latest.current.getValue
    ): void => {
      latest.current.onInteractionStart?.(
        valueFromTick(tick),
        getDetails(source)
      );
    },
    []
  );

  const endInteraction = useCallback(
    (
      source: RatingInteractionSource,
      tick: number,
      cancelled: boolean,
      valueFromTick: (tick: number) => Value = latest.current.getValue
    ): void => {
      latest.current.onChangeEnd?.(valueFromTick(tick), {
        cancelled,
        source,
      });

      if (!cancelled && mounted.current) {
        latest.current.onComplete(tick, source);
      }
    },
    []
  );

  const cancelPointerInteraction = useCallback(
    (updateVisualState = true): void => {
      const currentGesture = gesture.current;

      if (
        currentGesture.phase === "idle" ||
        currentGesture.phase === "cancelled"
      ) {
        return;
      }

      const accepted =
        currentGesture.phase === "committing" ||
        currentGesture.phase === "dragging";
      const finalTick = currentGesture.lastTick;
      const valueFromTick = currentGesture.getValue ?? latest.current.getValue;
      currentGesture.phase = "cancelled";
      if (updateVisualState) {
        updateVisual({ active: false, dragging: false, tick: null });
      }

      if (accepted) {
        endInteraction("pointer", finalTick, true, valueFromTick);
      }
    },
    [endInteraction, updateVisual]
  );

  useLayoutEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      cancelPointerInteraction(false);
    };
  }, [cancelPointerInteraction]);

  const previousStructure = useRef(structure);
  useLayoutEffect(() => {
    const changed = !areStructuresEqual(previousStructure.current, structure);
    previousStructure.current = structure;

    if (changed) {
      cancelPointerInteraction();
    }
  }, [cancelPointerInteraction, structure]);

  useLayoutEffect(() => {
    if (disabled) {
      cancelPointerInteraction();
    }
  }, [cancelPointerInteraction, disabled]);

  const commitDiscreteTick = useCallback(
    (tick: number, source: Exclude<RatingInteractionSource, "pointer">) => {
      const options = latest.current;

      if (options.disabled) {
        return;
      }

      const safeTick = Math.min(
        options.maxTick,
        Math.max(tick === 0 ? 0 : options.minTick, tick)
      );
      const startTick = options.currentTick;
      beginInteraction(source, startTick);

      if (
        !mounted.current ||
        latest.current.disabled ||
        !areStructuresEqual(options.structure, latest.current.structure)
      ) {
        endInteraction(source, startTick, true, options.getValue);
        return;
      }

      if (safeTick !== startTick) {
        options.onChangeTick(safeTick);

        if (
          !mounted.current ||
          latest.current.disabled ||
          !areStructuresEqual(options.structure, latest.current.structure)
        ) {
          endInteraction(source, safeTick, true, options.getValue);
          return;
        }
      }

      endInteraction(source, safeTick, false, options.getValue);
    },
    [beginInteraction, endInteraction]
  );

  const onLayout = useCallback((event: LayoutChangeEvent): void => {
    const { layout } = event.nativeEvent;
    const measuredExtent =
      latest.current.orientation === "horizontal"
        ? layout.width
        : layout.height;

    extent.current =
      Number.isFinite(measuredExtent) && measuredExtent > 0
        ? measuredExtent
        : latest.current.defaultExtent;
  }, []);

  const onStartShouldSetResponder = useCallback(
    (event: GestureResponderEvent): boolean =>
      !latest.current.disabled && getTouchCount(event) <= 1,
    []
  );

  const onResponderGrant = useCallback(
    (event: GestureResponderEvent): void => {
      const options = latest.current;

      if (options.disabled || getTouchCount(event) > 1) {
        resetInteraction();
        return;
      }

      const coordinates = getAxisCoordinates(event, options.orientation);
      const candidateTick = options.positionToTick(
        coordinates.location,
        extent.current
      );

      gesture.current = {
        getValue: options.getValue,
        lastEmittedTick: options.currentTick,
        lastTick: candidateTick,
        origin: coordinates.page - coordinates.location,
        phase: "pressed",
        startCrossAxis: coordinates.crossAxis,
        startPrimaryAxis: coordinates.page,
        startTick: options.currentTick,
      };
      updateVisual({
        active: true,
        dragging: false,
        tick: candidateTick,
      });
    },
    [resetInteraction, updateVisual]
  );

  const onResponderMove = useCallback(
    (event: GestureResponderEvent): void => {
      const currentGesture = gesture.current;

      if (
        currentGesture.phase === "idle" ||
        currentGesture.phase === "cancelled"
      ) {
        return;
      }

      const options = latest.current;

      if (options.disabled || getTouchCount(event) > 1) {
        cancelPointerInteraction();
        return;
      }

      const coordinates = getAxisCoordinates(event, options.orientation);
      const primaryDistance = Math.abs(
        coordinates.page - currentGesture.startPrimaryAxis
      );
      const crossDistance = Math.abs(
        coordinates.crossAxis - currentGesture.startCrossAxis
      );

      if (currentGesture.phase === "pressed") {
        if (options.interactionMode === "tap") {
          if (Math.max(primaryDistance, crossDistance) > TOUCH_SLOP) {
            currentGesture.phase = "cancelled";
            updateVisual({ active: false, dragging: false, tick: null });
          }

          return;
        }

        if (
          crossDistance > TOUCH_SLOP &&
          crossDistance > primaryDistance * AXIS_DOMINANCE_RATIO
        ) {
          currentGesture.phase = "cancelled";
          updateVisual({ active: false, dragging: false, tick: null });
          return;
        }

        if (
          primaryDistance <= TOUCH_SLOP ||
          primaryDistance <= crossDistance * AXIS_DOMINANCE_RATIO
        ) {
          return;
        }

        currentGesture.phase = "dragging";
        beginInteraction(
          "pointer",
          currentGesture.startTick,
          currentGesture.getValue ?? options.getValue
        );

        if (!isCurrentGesture(currentGesture, "dragging")) {
          return;
        }
      }

      const localPosition = coordinates.page - currentGesture.origin;
      const nextTick = options.positionToTick(localPosition, extent.current);
      currentGesture.lastTick = nextTick;
      updateVisual({ active: true, dragging: true, tick: nextTick });
      emitTick(nextTick);
    },
    [
      beginInteraction,
      cancelPointerInteraction,
      emitTick,
      isCurrentGesture,
      updateVisual,
    ]
  );

  const onResponderStart = useCallback(
    (event: GestureResponderEvent): void => {
      if (getTouchCount(event) > 1) {
        cancelPointerInteraction();
      }
    },
    [cancelPointerInteraction]
  );

  const onResponderEnd = useCallback(
    (event: GestureResponderEvent): void => {
      if (getTouchCount(event) > 1) {
        cancelPointerInteraction();
      }
    },
    [cancelPointerInteraction]
  );

  const onResponderRelease = useCallback(
    (event: GestureResponderEvent): void => {
      const currentGesture = gesture.current;

      if (
        currentGesture.phase === "idle" ||
        currentGesture.phase === "cancelled"
      ) {
        resetInteraction();
        return;
      }

      const options = latest.current;

      if (options.disabled) {
        cancelPointerInteraction();
        resetInteraction();
        return;
      }

      const coordinates = getAxisCoordinates(event, options.orientation);
      const primaryDistance = Math.abs(
        coordinates.page - currentGesture.startPrimaryAxis
      );
      const crossDistance = Math.abs(
        coordinates.crossAxis - currentGesture.startCrossAxis
      );
      const finalPointerTick = options.positionToTick(
        coordinates.page - currentGesture.origin,
        extent.current
      );
      const valueFromTick = currentGesture.getValue ?? options.getValue;

      if (currentGesture.phase === "pressed") {
        const movedBeyondSlop =
          Math.max(primaryDistance, crossDistance) > TOUCH_SLOP;

        if (movedBeyondSlop) {
          const primaryDominant =
            primaryDistance > crossDistance * AXIS_DOMINANCE_RATIO;

          if (options.interactionMode === "tap" || !primaryDominant) {
            resetInteraction();
            return;
          }

          currentGesture.lastTick = finalPointerTick;
          currentGesture.phase = "dragging";
          beginInteraction("pointer", currentGesture.startTick, valueFromTick);

          if (!isCurrentGesture(currentGesture, "dragging")) {
            return;
          }

          emitTick(finalPointerTick);

          if (!isCurrentGesture(currentGesture, "dragging")) {
            return;
          }

          resetInteraction();
          endInteraction("pointer", finalPointerTick, false, valueFromTick);
          return;
        }

        const finalTick =
          options.allowClear &&
          currentGesture.startTick !== 0 &&
          finalPointerTick === currentGesture.startTick
            ? 0
            : finalPointerTick;
        currentGesture.lastTick = finalTick;
        currentGesture.phase = "committing";
        beginInteraction("pointer", currentGesture.startTick, valueFromTick);

        if (!isCurrentGesture(currentGesture, "committing")) {
          return;
        }

        emitTick(finalTick);

        if (!isCurrentGesture(currentGesture, "committing")) {
          return;
        }

        resetInteraction();
        endInteraction("pointer", finalTick, false, valueFromTick);
        return;
      }

      currentGesture.lastTick = finalPointerTick;
      emitTick(finalPointerTick);

      if (!isCurrentGesture(currentGesture, "dragging")) {
        return;
      }

      resetInteraction();
      endInteraction("pointer", finalPointerTick, false, valueFromTick);
    },
    [
      beginInteraction,
      cancelPointerInteraction,
      emitTick,
      endInteraction,
      isCurrentGesture,
      resetInteraction,
    ]
  );

  const onResponderTerminate = useCallback((): void => {
    cancelPointerInteraction();
    resetInteraction();
  }, [cancelPointerInteraction, resetInteraction]);

  const onResponderTerminationRequest = useCallback(
    (): boolean =>
      gesture.current.phase !== "committing" &&
      gesture.current.phase !== "dragging",
    []
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent): void => {
      const options = latest.current;
      const { actionName } = event.nativeEvent;

      if (actionName === "increment") {
        commitDiscreteTick(
          getIncrementTick(
            options.currentTick,
            options.minTick,
            options.maxTick
          ),
          "accessibility"
        );
      } else if (actionName === "decrement") {
        commitDiscreteTick(
          getDecrementTick(
            options.currentTick,
            options.minTick,
            options.allowClear
          ),
          "accessibility"
        );
      }
    },
    [commitDiscreteTick]
  );

  const handleKeyDown = useCallback(
    (event: RatingKeyboardEvent): void => {
      const options = latest.current;
      const key = event.key ?? event.nativeEvent?.key;
      let nextTick: number | undefined;

      if (
        event.altKey === true ||
        event.ctrlKey === true ||
        event.metaKey === true ||
        event.nativeEvent?.altKey === true ||
        event.nativeEvent?.ctrlKey === true ||
        event.nativeEvent?.metaKey === true
      ) {
        return;
      }

      if (key === "ArrowRight" || key === "ArrowUp") {
        nextTick = getIncrementTick(
          options.currentTick,
          options.minTick,
          options.maxTick
        );
      } else if (key === "ArrowDown" || key === "ArrowLeft") {
        nextTick = getDecrementTick(
          options.currentTick,
          options.minTick,
          options.allowClear
        );
      } else if (key === "Home") {
        nextTick = getHomeTick(
          options.minTick,
          options.allowClear || options.currentTick === 0
        );
      } else if (key === "End") {
        nextTick = options.maxTick;
      }

      if (nextTick === undefined) {
        return;
      }

      event.preventDefault?.();
      event.stopPropagation?.();
      commitDiscreteTick(nextTick, "keyboard");
    },
    [commitDiscreteTick]
  );

  return {
    active: visualState.active,
    draftTick: visualState.tick,
    dragging: visualState.dragging,
    handleAccessibilityAction,
    handleKeyDown,
    trackHandlers: {
      onLayout,
      onResponderEnd,
      onResponderGrant,
      onResponderMove,
      onResponderRelease,
      onResponderStart,
      onResponderTerminate,
      onResponderTerminationRequest,
      onStartShouldSetResponder,
    },
  };
};

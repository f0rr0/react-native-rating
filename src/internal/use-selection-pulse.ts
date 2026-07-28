import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, Platform } from "react-native";

interface UseSelectionPulseOptions {
  enabled: boolean;
  getItemIndex: (tick: number) => number;
  mappingKey: number | string;
  reduceMotion: boolean;
}

interface UseSelectionPulseResult {
  pulse: (tick: number) => void;
  pulseIndex: number | null;
  scale: Animated.Value;
}

interface PulseState {
  enabled: boolean;
  index: number | null;
  mappingKey: number | string;
  reduceMotion: boolean;
}

export const useSelectionPulse = ({
  enabled,
  getItemIndex,
  mappingKey,
  reduceMotion,
}: UseSelectionPulseOptions): UseSelectionPulseResult => {
  const latest = useRef({ enabled, getItemIndex, mappingKey, reduceMotion });
  useLayoutEffect(() => {
    latest.current = { enabled, getItemIndex, mappingKey, reduceMotion };
  }, [enabled, getItemIndex, mappingKey, reduceMotion]);

  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const generation = useRef(0);
  const scale = useMemo(() => new Animated.Value(1), []);
  const [pulseState, setPulseState] = useState<PulseState>(() => ({
    enabled,
    index: null,
    mappingKey,
    reduceMotion,
  }));
  const previousMappingKey = useRef(mappingKey);
  const pulseStateIsCurrent =
    pulseState.enabled === enabled &&
    pulseState.reduceMotion === reduceMotion &&
    Object.is(pulseState.mappingKey, mappingKey);

  if (!pulseStateIsCurrent) {
    setPulseState({
      enabled,
      index: null,
      mappingKey,
      reduceMotion,
    });
  }

  const stop = useCallback((): void => {
    generation.current += 1;
    animation.current?.stop();
    animation.current = null;
    scale.setValue(1);
  }, [scale]);

  const pulse = useCallback(
    (tick: number): void => {
      const options = latest.current;

      if (!options.enabled || options.reduceMotion || tick <= 0) {
        return;
      }

      const itemIndex = options.getItemIndex(tick);

      if (itemIndex < 0) {
        return;
      }

      generation.current += 1;
      const pulseGeneration = generation.current;
      animation.current?.stop();
      setPulseState({
        enabled: options.enabled,
        index: itemIndex,
        mappingKey: options.mappingKey,
        reduceMotion: options.reduceMotion,
      });
      scale.setValue(0.92);
      const nextAnimation = Animated.timing(scale, {
        duration: 150,
        easing: Easing.out((time) => Easing.cubic(time)),
        isInteraction: false,
        toValue: 1,
        useNativeDriver: Platform.OS !== "web",
      });
      animation.current = nextAnimation;
      nextAnimation.start(({ finished }) => {
        if (finished && generation.current === pulseGeneration) {
          animation.current = null;
          setPulseState((current) => ({ ...current, index: null }));
        }
      });
    },
    [scale]
  );

  useEffect(() => {
    if (!enabled || reduceMotion) {
      stop();
    }

    return () => {
      generation.current += 1;
      animation.current?.stop();
      animation.current = null;
    };
  }, [enabled, reduceMotion, stop]);

  useEffect(() => {
    if (!Object.is(previousMappingKey.current, mappingKey)) {
      previousMappingKey.current = mappingKey;
      stop();
    }
  }, [mappingKey, stop]);

  return {
    pulse,
    pulseIndex:
      pulseStateIsCurrent && enabled && !reduceMotion ? pulseState.index : null,
    scale,
  };
};

import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

type StoreListener = () => void;

const listeners = new Set<StoreListener>();
let reduceMotion = true;
let requestGeneration = 0;
let nativeSubscription: { remove: () => void } | undefined;

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const updatePreference = (preference: boolean): void => {
  if (reduceMotion === preference) {
    return;
  }

  reduceMotion = preference;
  notifyListeners();
};

const readPreference = async (generation: number): Promise<void> => {
  try {
    const preference = await AccessibilityInfo.isReduceMotionEnabled();

    if (generation === requestGeneration && listeners.size > 0) {
      updatePreference(preference);
    }
  } catch {
    // A missing platform implementation keeps the conservative reduced default.
  }
};

const startNativeSubscription = (): void => {
  requestGeneration += 1;
  const generation = requestGeneration;

  nativeSubscription = AccessibilityInfo.addEventListener(
    "reduceMotionChanged",
    updatePreference
  );

  void readPreference(generation);
};

const stopNativeSubscription = (): void => {
  requestGeneration += 1;
  nativeSubscription?.remove();
  nativeSubscription = undefined;
  reduceMotion = true;
};

const subscribe = (listener: StoreListener): (() => void) => {
  listeners.add(listener);

  if (listeners.size === 1) {
    startNativeSubscription();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      stopNativeSubscription();
    }
  };
};

const unsubscribeDisabled = (): void => {
  // No store subscription is created when motion is disabled.
};
const subscribeDisabled = (): (() => void) => unsubscribeDisabled;
const getSnapshot = (): boolean => reduceMotion;
const getReducedSnapshot = (): boolean => true;

export const useReducedMotion = (enabled: boolean): boolean =>
  useSyncExternalStore(
    enabled ? subscribe : subscribeDisabled,
    enabled ? getSnapshot : getReducedSnapshot,
    getReducedSnapshot
  );

# React Native Rating

[![npm version](https://img.shields.io/npm/v/react-native-rating.svg)](https://www.npmjs.com/package/react-native-rating) [![npm downloads](https://img.shields.io/npm/dm/react-native-rating.svg)](https://www.npmjs.com/package/react-native-rating) [![CI](https://github.com/f0rr0/react-native-rating/actions/workflows/ci.yml/badge.svg)](https://github.com/f0rr0/react-native-rating/actions/workflows/ci.yml) [![license](https://img.shields.io/npm/l/react-native-rating.svg)](./LICENSE.md)

Accessible React Native star rating, drag rating, and semantic feedback scale for iOS, Android, Expo, and React Native Web.

Fractional values, RTL and vertical layouts, keyboard and screen-reader support, a FlatList-friendly display path, and zero runtime dependencies.

## Why this rating component?

- **One accessible control.** Native assistive technologies get an adjustable control; the Web gets a real ARIA slider with keyboard input.
- **Tap or deliberate drag.** Opt-in dragging respects the primary axis and yields to a parent ScrollView before drag intent is clear.
- **One fractional model.** Pointer input, controlled state, visual fill, keyboard changes, and announced values use the same integer-tick math.
- **Ratings beyond stars.** `RatingScale` supports NPS, Likert, emoji, string values, zero, negative values, and a nullable empty selection.
- **Static lists stay static.** `RatingDisplay` creates no responder, animation, or reduced-motion subscription.
- **Universal by design.** Horizontal, vertical, LTR, RTL, native, and Web behavior are explicit rather than inferred from icon order.
- **Bring any visual.** The default star uses React Native core `Text`; `renderItem` accepts an icon, SVG, image, emoji, or design-system component.

## Install

```sh
npm install react-native-rating
```

```sh
yarn add react-native-rating
```

```sh
bun add react-native-rating
```

The package requires React 19.1.1 or newer and React Native 0.82 or newer. It uses only React and React Native core APIs, so Expo projects need no native module setup. React Native Web support assumes the application already has its normal Web target configured.

## Quick start

```tsx
import { useState } from "react";
import { Rating } from "react-native-rating";

export function ReviewScore() {
  const [value, setValue] = useState(3.5);

  return (
    <Rating
      accessibilityLabel="Product rating"
      onChange={setValue}
      step={0.5}
      value={value}
    />
  );
}
```

Use `defaultValue` instead of `value` for an uncontrolled input.

## Try the full example

The checked Expo example demonstrates deliberate drag inside a `ScrollView`, fractional input, exact display, custom rendering, vertical layout, RTL, and a semantic scale with negative and zero values:

```sh
cd example
bun install
bun run web
```

The example also provides `bun run ios` and `bun run android` scripts for local simulator/device testing. CI installs the packed package into a clean copy, type-checks it, exports its Web bundle, and server-renders representative React Native Web trees while rejecting runtime diagnostics or invalid pointer-event output.

## Tap, drag, fractions, and limits

Tap is the conservative default. Add `interactionMode="tap-and-drag"` when scrubbing across the rating is useful:

```tsx
<Rating
  accessibilityLabel="Photo rating"
  allowClear
  interactionMode="tap-and-drag"
  max={5}
  min={1}
  onChange={setRating}
  step={0.25}
  value={rating}
/>
```

- `step` is the selectable precision within each item and is clamped to `0.01`–`1`.
- `min` is the smallest selectable nonzero value. Zero remains the unrated sentinel.
- With `allowClear`, a true same-value tap, decrement at the minimum, or Home on the Web clears the rating.
- Drag callbacks are deduplicated by selectable tick, including when a controlled parent updates slowly.
- Gaps are measured as part of the track; either half of a gap resolves to the nearest selectable edge.
- Counts and layout inputs are defensive boundaries: `max`/scale items are capped at `100`, and finite `size`, `gap`, and `itemExtent` values are capped at `1024`.

## RTL and vertical ratings

`direction="auto"` follows `I18nManager.isRTL`. Override it for a locally directed control, or switch the interaction axis independently:

```tsx
<Rating direction="rtl" value={4} />

<Rating
  accessibilityLabel="Intensity"
  interactionMode="tap-and-drag"
  orientation="vertical"
  value={intensity}
/>
```

Horizontal fill and pointer progression follow `direction`. Vertical ratings progress from bottom to top, so Up Arrow and the native increment action both move upward. On `RatingScale`, `reversed` remaps the ordered semantic choices without reversing pointer geometry or locale direction.

## Accessible on native and Web

Interactive ratings have one focus stop, not one stop per star:

- iOS and Android receive `accessibilityRole="adjustable"`, the current value, and increment/decrement accessibility actions.
- React Native Web receives `role="slider"`, direct `aria-value*` attributes, a visible two-color focus indicator, and standard slider keys. Use `focusStyle` to compose a product-specific focused treatment after that default.
- Right Arrow and Up Arrow increment; Left Arrow and Down Arrow decrement; Home selects the current lower bound (empty when already empty or clearing is allowed, otherwise `min`); End selects the maximum.
- Visible items retain a 44pt cross-axis target on iOS and 48dp elsewhere without adding artificial width between adjacent choices.
- The quiet completion pulse is disabled when the system requests reduced motion. Dragging itself is never animated.

Always provide a useful `accessibilityLabel`. Localize the spoken value with `formatAccessibilityValue`:

```tsx
<Rating
  accessibilityLabel="Satisfaction"
  formatAccessibilityValue={(value, max) => `${value} de ${max} estrellas`}
  value={4.5}
/>
```

Use `disabled` for a temporarily unavailable input. Use `RatingDisplay` or `readOnly` for content that is not an input.

## FlatList: interactive rows and exact displays

### Interactive ratings

Own each row's controlled value by its stable domain ID. Do not use one shared rating value or the visible list index:

```tsx
import { useState } from "react";
import { FlatList } from "react-native";
import { Rating } from "react-native-rating";

export function ReviewEditor({ reviews }: { reviews: Review[] }) {
  const [ratingsById, setRatingsById] = useState<Record<string, number>>({});

  return (
    <FlatList
      data={reviews}
      extraData={ratingsById}
      keyExtractor={(review) => review.id}
      renderItem={({ item }) => (
        <Rating
          accessibilityLabel={`Rating for ${item.title}`}
          onChange={(nextValue) => {
            setRatingsById((current) => ({
              ...current,
              [item.id]: nextValue,
            }));
          }}
          value={ratingsById[item.id] ?? item.rating}
        />
      )}
    />
  );
}
```

For expensive persistence, save the keyed row in `onChangeEnd` and keep `onChange` for responsive local state.

### Read-only and high-density lists

`RatingDisplay` is the dedicated read-only component. It renders an exact aggregate such as `4.37` by default; pass `step` only when display snapping is intentional.

```tsx
import { FlatList } from "react-native";
import { RatingDisplay } from "react-native-rating";

<FlatList
  data={reviews}
  keyExtractor={(review) => review.id}
  renderItem={({ item }) => (
    <RatingDisplay
      accessibilityLabel={`Rating for ${item.title}`}
      size={20}
      value={item.averageRating}
    />
  )}
/>;
```

`<Rating readOnly />` also selects the static path, but `RatingDisplay` makes the intent clearest in list cells and aggregate views. When adjacent text already communicates the same value, pass `decorative` to hide the duplicate visual from assistive technology:

```tsx
<Text>4.37 out of 5</Text>
<RatingDisplay decorative value={4.37} />
```

## NPS, Likert, and emoji scales

`RatingScale` is generic over finite numbers or strings. `null` means “no selection,” so zero and negative values remain first-class answers.

### Net Promoter Score

```tsx
import { useState } from "react";
import { RatingScale } from "react-native-rating";

const NPS_ITEMS = Array.from({ length: 11 }, (_, score) => ({
  content: score,
  label: `${score} out of 10`,
  value: score,
}));

export function NpsQuestion() {
  const [score, setScore] = useState<number | null>(null);

  return (
    <RatingScale
      accessibilityLabel="Likelihood to recommend"
      allowClear
      items={NPS_ITEMS}
      onChange={setScore}
      size={36}
      value={score}
    />
  );
}
```

### Emoji Likert scale

```tsx
const EXPERIENCE = [
  { value: "very-bad", label: "Very bad", content: "😞" },
  { value: "bad", label: "Bad", content: "🙁" },
  { value: "neutral", label: "Neutral", content: "😐" },
  { value: "good", label: "Good", content: "🙂" },
  { value: "very-good", label: "Very good", content: "😍" },
] as const;

<RatingScale
  accessibilityLabel="Checkout experience"
  items={EXPERIENCE}
  onChange={setExperience}
  value={experience}
/>;
```

Use `selectionMode="single"` for one highlighted choice (the default), or `selectionMode="cumulative"` for star-like fill through the selected item. Each nonblank `label` supplies semantic meaning even when `content` is only an emoji or icon.

`itemExtent` controls each choice's primary-axis length independently of `size`. Increase it for longer labels in a horizontal scale without inflating the cross-axis target. It is never smaller than `size`; for a long custom vertical presentation, use `renderItem` and its `itemExtent` value to lay out the content deliberately. A read-only scale can also be `decorative` when equivalent adjacent content is already accessible.

## Custom rendering

The default star has no icon-library dependency. A render slot receives all state needed to keep custom visuals aligned with interaction and accessibility:

```tsx
<Rating
  activeColor="#6D28D9"
  inactiveColor="#737373"
  renderItem={({ fill, fillOrigin, pressed, size }) => (
    <BrandStar
      fill={fill}
      fillOrigin={fillOrigin}
      pressed={pressed}
      size={size}
    />
  )}
  step={0.1}
  value={4.3}
/>
```

Numeric `renderItem` receives:

- `fill` from `0` to `1`, `fillOrigin`, `index`, and the item's one-based `value`;
- resolved `direction` and `orientation`;
- `pressed`, `disabled`, `size`, `activeColor`, and `inactiveColor`.

`RatingScale` has its own typed `renderItem` with the semantic `value`, `label`, `content`, `selected`, `itemExtent`, and the same interaction/visual context. Returned content is visual-only; put control semantics and labels on the root component.

## Controlled values and callback contract

```tsx
<Rating
  onChange={(nextValue) => {
    // Fast local state: may run for each distinct tick during a drag.
    setValue(nextValue);
  }}
  onChangeEnd={(finalValue, { cancelled, source }) => {
    // Persistence/analytics: once per accepted interaction.
    if (!cancelled) {
      saveRating(finalValue, source);
    }
  }}
  onInteractionStart={(startValue, { source }) => {
    beginRatingInteraction(startValue, source);
  }}
  value={value}
/>
```

- `onInteractionStart` runs once when an interaction is accepted.
- `onChange` runs synchronously for each distinct selected value. A drag can produce multiple calls; a no-op interaction produces none.
- `onChangeEnd` runs once with the final value and `{ source: "pointer" | "keyboard" | "accessibility", cancelled }`.
- A responder termination after drag acceptance reports `cancelled: true`. Cross-axis scroll intent before acceptance produces no lifecycle callbacks.
- In controlled mode the prop remains the source of truth. A local draft keeps the gesture responsive until the parent renders the new value.

Apply expensive network writes in `onChangeEnd`, not `onChange`.

## Core props

### `Rating`

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | — | Controlled numeric value |
| `defaultValue` | `0` | Initial uncontrolled value |
| `onChange` | — | Each distinct user-selected value |
| `onInteractionStart` | — | Start of an accepted interaction |
| `onChangeEnd` | — | Final value, source, and cancellation state |
| `max` | `5` | Item count, clamped to `1`–`100` |
| `min` | `0` | Smallest selectable nonzero value |
| `step` | `1` | Per-item precision, clamped to `0.01`–`1` |
| `allowClear` | `false` | Permit returning to the zero sentinel |
| `interactionMode` | `"tap"` | `"tap"` or `"tap-and-drag"` |
| `disabled` | `false` | Disable input and expose disabled semantics |
| `readOnly` | `false` | Use the static display path |
| `animated` | `true` | Enable reduced-motion-aware completion feedback |
| `focusStyle` | — | Compose a custom Web treatment after the default focused style |
| `renderItem` | text star | Render a custom visual item |

### `RatingDisplay`

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | required | Exact finite display value, clamped to range |
| `disabled` | `false` | Dim the display and expose disabled semantics to custom items |
| `decorative` | `false` | Hide a duplicate visual from assistive technology |
| `max` | `5` | Item count |
| `step` | — | Optional visual snapping |
| `formatAccessibilityValue` | `"x out of y"` | Localized accessible value |
| `renderItem` | text star | Render a custom visual item |

### `RatingScale`

| Prop | Default | Purpose |
| --- | --- | --- |
| `items` | required | Ordered `{ value, label, content? }` choices |
| `value` | — | Controlled value; `null` means empty |
| `defaultValue` | `null` | Initial uncontrolled value |
| `onChange` | — | Each distinct semantic value |
| `onInteractionStart` | — | Start of an accepted interaction |
| `onChangeEnd` | — | Final semantic value, source, and cancellation state |
| `allowClear` | `false` | Permit a `null` selection |
| `disabled` | `false` | Disable input and expose disabled semantics |
| `readOnly` | `false` | Use the static scale path |
| `decorative` | `false` | Hide a read-only duplicate visual from assistive technology |
| `selectionMode` | `"single"` | `"single"` or `"cumulative"` visuals |
| `reversed` | `false` | Reverse semantic progression |
| `interactionMode` | `"tap"` | `"tap"` or `"tap-and-drag"` |
| `itemExtent` | `size` | Primary-axis length per choice; normalized to at least `size` |
| `animated` | `true` | Enable reduced-motion-aware completion feedback |
| `focusStyle` | — | Compose a custom Web treatment after the default focused style |
| `renderItem` | label/content | Render a typed semantic item |

All three components accept `size`, `gap`, `activeColor`, `inactiveColor`, `direction`, `orientation`, a component-specific `formatAccessibilityValue`, `style`, `testID`, `ref`, and non-conflicting React Native `View` props. `Rating` and `RatingScale` share the interactive lifecycle, `interactionMode`, `disabled`, `readOnly`, `animated`, and `focusStyle`; `RatingDisplay` is always static.

The components own their root responder, keyboard, accessibility, focusability, pointer-routing, role, tab-order, and numeric ARIA props. These keys are omitted from the TypeScript root-prop contract and removed again at runtime to protect JavaScript consumers and broad object spreads. Consumer focus/blur handlers and visual styles still compose normally.

## Performance

- `RatingDisplay` and read-only scales skip responder handlers, animation values, and reduced-motion listeners.
- One root track handles pointer input; items do not each allocate a press or pan responder.
- Numeric and semantic visual items are memoized, and one shared transform value pulses only the completed item.
- Animated native targets use the native driver on iOS and Android and are marked non-interactive; no animation is scheduled during a drag.
- Reduced-motion state uses one shared native subscription, regardless of the number of interactive ratings.

For large lists, prefer `RatingDisplay`, keep `items` arrays and `renderItem` callbacks stable, and give the list a stable `keyExtractor`.

## Feature comparison

This is a source-level comparison of the versions audited on 2026-07-28, not a popularity claim. “Partial” means the package covers some of the behavior but not the complete row.

| Capability | `react-native-rating` | [`react-native-star-rating-widget` 1.11.0](https://github.com/bviebahn/react-native-star-rating-widget/tree/c8906b677061ca7ac252c191419495e8cdefa381) | [`@kolking/react-native-rating` 1.4.1](https://github.com/kolking/react-native-rating/tree/19382752e7a47cd5370d0e5206fc107ad52be3e2) | [`react-native-ratings` 8.1.0](https://github.com/Monte9/react-native-ratings/tree/0a8f16b4380626556b636e8883b06c0db9e885ec) |
| --- | --- | --- | --- | --- |
| No required third-party runtime package | Yes | No; requires `react-native-svg` | Yes | No; depends on `lodash` |
| Deliberate, cross-axis-aware drag ownership | Yes | No; start/move capture is unconditional | No; starts immediately and refuses termination | No; starts immediately |
| Fraction selection and visual fill share one exact model | Yes, `0.01`–`1` | Fixed full/half/quarter | Partial; decimal display, whole-item input | Partial; an [open issue](https://github.com/Monte9/react-native-ratings/issues/155) reports jump/UI divergence |
| Dedicated allocation-light static component | Yes | Yes | No; uses `disabled` on the interactive component | No; `readonly` stays in the swipe component |
| Native adjustable semantics plus Web ARIA slider keys | Yes | Partial; native actions, no direct Web key handler in audited source | No control semantics in audited source | No; [accessibility remains open](https://github.com/Monte9/react-native-ratings/issues/172) |
| Explicit LTR/RTL override and vertical orientation | Yes | Partial; automatic RTL, horizontal | Partial; automatic RTL, horizontal | No; [RTL issue open](https://github.com/Monte9/react-native-ratings/issues/81) |
| Generic NPS/Likert/emoji scale with `null`, zero, negatives, and strings | Yes | No | No | No; [bidirectional scale request open](https://github.com/Monte9/react-native-ratings/issues/189) |

See the dated [competitive analysis](./docs/COMPETITIVE_ANALYSIS.md) for the search method, source audit, issue evidence, and positioning decisions. See the [architecture and release plan](./docs/ARCHITECTURE.md) for interaction, performance, accessibility, and QA invariants.

## Compatibility

| Dependency or platform | Supported baseline |
| --- | --- |
| React | `>=19.1.1` |
| React Native | `>=0.82.0` |
| iOS and Android | React Native core renderer |
| Expo | Managed or bare projects matching the peer versions |
| Web | React Native Web through the application's existing setup; packed-package export and DOM server-render smoke coverage in CI |
| Module formats | ESM and CommonJS, with TypeScript declarations |

## Migrating

### From 3.x to 4.0

The value contract remains familiar: existing `Rating` usage stays controlled with `value`/`onChange` or uncontrolled with `defaultValue`. Version 4 is still a major release because the root interaction ownership, item geometry, and default visuals change:

- `Rating`, `RatingDisplay`, and `RatingScale` now own responder and keyboard callbacks; `accessible`/`focusable`/`pointerEvents`; role and tab order; accessibility actions, state, value, and subtree-hiding props; and the corresponding `aria-*` range/label/disabled/hidden attributes. Remove forwarded overrides such as `onKeyDown`, responder callbacks, `role`, `tabIndex`, and `aria-value*`; the TypeScript API excludes them and a runtime sanitizer drops them from JavaScript spreads. Use the documented rating callbacks and accessibility props instead.
- Interactive items now use their natural `size` along the primary axis and retain the 44pt/48dp minimum only on the cross axis. `gap` is visual space between items. Recheck snapshots or layouts that depended on the wider v3 per-item touch boxes.
- The default stars are filled/outlined (`★`/`☆`) and the default colors are darker for stronger state distinction and light-surface contrast. Pass `renderItem`, `activeColor`, and `inactiveColor` to preserve a custom visual treatment.
- Web focus now uses a two-color indicator by default. Use `focusStyle` to compose an application-specific focused treatment.
- Consumer root styles still compose, but structural `direction` is owned so rendered order and pointer geometry cannot diverge. Vertical controls now progress bottom-to-top.

- Add `interactionMode="tap-and-drag"` to opt into dragging; tap remains the default.
- Use the new `onChangeEnd` for persistence and analytics.
- Replace list-cell `<Rating readOnly />` with `RatingDisplay` when you want explicit static intent and exact unsnapped aggregate values. Mark duplicate static visuals with `RatingDisplay decorative` or a read-only `RatingScale decorative`.
- Use `min` for the verified minimum-rating request.
- Use `RatingScale` rather than overloading zero when zero or negative values are meaningful. Use `itemExtent` when a semantic choice needs more primary-axis room than its visual `size`.

All of these changes ship together in one version; there is no intermediate API or feature-flag migration.

### From 2.x

Version 3 introduced the modern API:

| 2.x                   | 3.x and newer                                  |
| --------------------- | ---------------------------------------------- |
| default import        | `import { Rating } from "react-native-rating"` |
| `initial`             | `defaultValue`                                 |
| internal state only   | `value` + `onChange`, or `defaultValue`        |
| `editable={false}`    | `readOnly` or `RatingDisplay`                  |
| image props required  | built-in star or `renderItem`                  |
| animation callbacks   | synchronous input callbacks                    |
| style-sized touchable | accessible 44pt/48dp cross-axis target         |

## Develop

The repository pins Bun, Node, hk, and Pkl with mise:

```sh
mise install
mise run deps
mise run check
```

`bun run fix` applies the Ultracite Oxlint/Oxfmt rules.

Releases use a reviewable Release Please pull request and npm trusted publishing. See the [release guide](https://github.com/f0rr0/react-native-rating/blob/master/.github/RELEASING.md).

## License

MIT

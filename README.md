# react-native-rating

A small, accessible rating input for modern React Native. Zero runtime dependencies, sensible touch targets, fractional values, and motion that respects the system preference.

## Install

```sh
bun add react-native-rating
```

Requires React 19.1+ and React Native 0.82+.

## Use

```tsx
import { useState } from "react";
import { Rating } from "react-native-rating";

export function ReviewScore() {
  const [value, setValue] = useState(3.5);

  return (
    <Rating
      accessibilityLabel="Review score"
      onChange={setValue}
      step={0.5}
      value={value}
    />
  );
}
```

Use `defaultValue` instead of `value` for an uncontrolled input. Set `readOnly` for static ratings or `disabled` when the input is temporarily unavailable.

## Customize

The built-in star is rendered with core React Native `Text`. A render slot keeps the package independent of any icon or SVG library:

```tsx
<Rating
  activeColor="#6D5EF5"
  inactiveColor="#D9D7F3"
  renderItem={({ fill, size }) => (
    <BrandStar fill={fill} height={size} width={size} />
  )}
  value={4}
/>
```

`renderItem` receives `fill` from 0 to 1, plus `index`, `value`, `size`, `pressed`, `disabled`, and both colors.

## Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | — | Controlled value |
| `defaultValue` | `0` | Initial uncontrolled value |
| `onChange` | — | Receives a user-selected value |
| `max` | `5` | Number of items |
| `step` | `1` | Per-item selection precision (`0.01`–`1`) |
| `allowClear` | `false` | Clear by selecting the current value |
| `disabled` | `false` | Disable interaction |
| `readOnly` | `false` | Expose the rating as static content |
| `size` | `28` | Visible item size |
| `gap` | `0` | Space between touch targets |
| `activeColor` | `#E8A317` | Selected color |
| `inactiveColor` | `#D5D9E0` | Unselected color |
| `animated` | `true` | Enable subtle, reduced-motion-aware feedback |
| `formatAccessibilityValue` | `"x out of y"` | Localize the announced value |
| `renderItem` | text star | Render a custom item |

All non-conflicting React Native `View` props, including `style`, `testID`, and `accessibilityLabel`, are forwarded to the root view.

## Accessibility

Interactive ratings are exposed as one adjustable control with native increment and decrement actions, avoiding five repetitive screen-reader stops. The current, minimum, and maximum values are announced. Visible item targets remain at least 44pt on iOS and 48dp elsewhere.

## Migrating from 2.x

Version 3 is a deliberate API reset:

| 2.x                   | 3.x                                     |
| --------------------- | --------------------------------------- |
| default import        | `import { Rating } from "…"`            |
| `initial`             | `defaultValue`                          |
| internal state only   | `value` + `onChange`, or `defaultValue` |
| `editable={false}`    | `readOnly`                              |
| image props required  | built-in star or `renderItem`           |
| animation callbacks   | respond to the synchronous `onChange`   |
| style-sized touchable | accessible 44pt/48dp item touch targets |

## Develop

The repository pins Bun, Node, hk, and Pkl with mise:

```sh
mise install
mise run deps
mise run check
```

`bun run fix` applies the Ultracite Oxlint/Oxfmt rules.

Releases use a reviewable Release Please pull request and npm trusted publishing. See [the release guide](https://github.com/f0rr0/react-native-rating/blob/master/.github/RELEASING.md).

## License

MIT

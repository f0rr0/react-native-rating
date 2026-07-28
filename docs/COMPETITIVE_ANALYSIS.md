# Competitive analysis: React Native rating components

Evidence date: **2026-07-28**

Search capture: **2026-07-28 04:07 UTC**, using an English-language/global research surface.

This document records the evidence behind the next version of `react-native-rating`. It separates observed facts from product inferences so the public positioning stays defensible.

## Scope and method

The audit combined four evidence sets:

1. The first-two-page result depth for the query families “react native rating component,” “react native star rating component,” “React Native ratings library,” and “React Native rating input Expo Web accessibility.”
2. Current npm package metadata and the npm downloads API.
3. The published source or current release commit of recurring results.
4. Open and historically relevant GitHub issues, plus this repository's open issues and pull requests.

The research surface merged some query results and did not expose stable per-query rank or locale metadata. Search order is also volatile and personalized. The package map is therefore a recurring-hit sample across the reviewed first-two-page depth, npm, and GitHub—not a reproducible ranking or a claim that every user will see the same ordering. In-app store-review launchers such as `react-native-rate` were excluded because they solve a different job.

The download count is the npm `last-week` result for **2026-07-18 through 2026-07-24**. `@rneui/base` is a toolkit-wide count and cannot be attributed to its Rating component alone.

## Search-hit and package map

| Package | Audited release/source | npm downloads | What it establishes |
| --- | --- | --: | --- |
| [`react-native-ratings`](https://www.npmjs.com/package/react-native-ratings) | [8.1.0 / `0a8f16b`](https://github.com/Monte9/react-native-ratings/tree/0a8f16b4380626556b636e8883b06c0db9e885ec) | 135,113 | Strong name recognition; tap/swipe modes, built-in image types, review labels |
| [`@rneui/base`](https://www.npmjs.com/package/@rneui/base) | [5.0.0 / `32ae0ed`](https://github.com/react-native-elements/react-native-elements/tree/32ae0eda7c559f55a9d858fc6880ed46f7714c5b) | 68,276 toolkit-wide | Rating bundled into a broad UI system; current wrapper still derives from a swipe-rating design |
| [`react-native-star-rating-widget`](https://www.npmjs.com/package/react-native-star-rating-widget) | [1.11.0 / `c8906b6`](https://github.com/bviebahn/react-native-star-rating-widget/tree/c8906b677061ca7ac252c191419495e8cdefa381) | 16,768 | Modern TypeScript, animation, full/half/quarter input, custom icon, separate display |
| [`react-native-star-rating`](https://www.npmjs.com/package/react-native-star-rating) | [1.1.0](https://github.com/djchie/react-native-star-rating) | 3,690 | An old result that continues to rank; vector-icon-era installation and per-star buttons |
| [`@rn-vui/ratings`](https://www.npmjs.com/package/@rn-vui/ratings) | [0.5.0 / `05783ad`](https://github.com/deepktp/react-native-vikalp-ratings/tree/05783ad7fa318fbe995082fd71f69c4c572fbc25) | 2,840 | A maintained fork of the familiar swipe/tap API with some newer semantics and tests |
| [`@kolking/react-native-rating`](https://www.npmjs.com/package/@kolking/react-native-rating) | [1.4.1 / `1938275`](https://github.com/kolking/react-native-rating/tree/19382752e7a47cd5370d0e5206fc107ad52be3e2) | 2,135 | Zero dependencies, polished presets, exact decimal display, custom images |
| [`react-native-stars`](https://www.npmjs.com/package/react-native-stars) | [1.2.2 / `8a967ab`](https://github.com/Extrct/react-native-stars/tree/8a967ab17462dd1de3af445dd220da6f9197b2a0) | 1,785 | Simple full/half selection, arbitrary partial display, images or elements |
| [`@aashu-dubey/react-native-rating-bar`](https://www.npmjs.com/package/@aashu-dubey/react-native-rating-bar) | [0.3.6 / `34fb0cf`](https://github.com/Aashu-Dubey/react-native-rating-bar/tree/34fb0cf0c0b38cdf3f8c002d42ef6fc435978175) | 152 | Gesture Handler implementation with horizontal/vertical/reverse and RTL options |
| [`react-native-rating-star`](https://www.npmjs.com/package/react-native-rating-star) | [0.2.1](https://github.com/liuchungui/react-native-star-rating) | 2 | A 2016 image-based result; useful as search-history context, not a modern baseline |

Primary download endpoint pattern: `https://api.npmjs.org/downloads/point/last-week/<package>`.

## This repository's open work

### Issues

| Item | Verified request | Next-version disposition |
| --- | --- | --- |
| [#4: half-filled stars](https://github.com/f0rr0/react-native-rating/issues/4) | Display and select values such as 2.5 and 4.5 | Close with one numeric tick model. Half, quarter, tenth, and other supported steps use the same selection and fill calculation. |
| [#8: pass an element instead of images](https://github.com/f0rr0/react-native-rating/issues/8) | Use vector icons/components and control their colors | Close with `renderItem`, including `fill`, direction, orientation, state, size, and colors. |
| [#13: disabled indexes or a minimum](https://github.com/f0rr0/react-native-rating/issues/13) | The body explicitly accepts either sparse disabled stars or `min={3}` | Close with `min`. Sparse holes would make slider increment/decrement and drag semantics harder to predict; the verified minimum use case has a coherent model. |
| [#14: ratings in FlatList](https://github.com/f0rr0/react-native-rating/issues/14) | Identify and render independent list-row ratings | Close with controlled row values plus the dedicated `RatingDisplay` static path for review/aggregate lists. |
| [#10: Greenkeeper activation](https://github.com/f0rr0/react-native-rating/issues/10) | Obsolete Greenkeeper service setup | Close as obsolete; current dependency automation and Release Please replace it. |

### Pull requests

| Item | State on 2026-07-28 | Decision |
| --- | --- | --- |
| [#9: update rating externally](https://github.com/f0rr0/react-native-rating/pull/9) | Open, conflicting, edits the removed `src/rating.js` architecture | Superseded by the controlled `value` API introduced in v3 and retained here. Do not transplant the old diff. |
| [#11: selected/unselected elements](https://github.com/f0rr0/react-native-rating/pull/11) | Open, conflicting, edits the removed `src/rating.js` architecture | Superseded by the typed `renderItem` API, which also handles fractional fill and interaction state. |
| [#18: Jest dependency group](https://github.com/f0rr0/react-native-rating/pull/18) | Open; dependency review passes, but the main Check fails and the React Native matrix is skipped. The Jest 30 runtime calls `clearMocksOnScope`, which is absent from React Native preset's Jest 29 module mocker. | Structurally mergeable on GitHub, but not mergeable as a validated change today. Do not fold it in merely because it is newer. Reproduce a Jest 30 upgrade only when Jest and the React Native preset/module-mocker generation agree and the full matrices pass. |

The exact `clearMocksOnScope` failure is preserved in [#18's Check job](https://github.com/f0rr0/react-native-rating/actions/runs/30319643698/job/90152631361).

The product changes above belong in one next-version pull request. There is no intermediate compatibility component or partial feature release.

## Competitor implementation and issue audit

### `react-native-star-rating-widget`

What works well:

- A clear split between interactive [`StarRating`](https://github.com/bviebahn/react-native-star-rating-widget/blob/c8906b677061ca7ac252c191419495e8cdefa381/src/StarRating.tsx) and static [`StarRatingDisplay`](https://github.com/bviebahn/react-native-star-rating-widget/blob/c8906b677061ca7ac252c191419495e8cdefa381/src/StarRatingDisplay.tsx).
- Explicit interaction start/end callbacks, a custom icon component, native adjustable actions, animation, and automatic RTL handling.

Verified limitations and pain:

- The responder returns true for start, start capture, move, and move capture. That is observable in [`StarRating.tsx`](https://github.com/bviebahn/react-native-star-rating-widget/blob/c8906b677061ca7ac252c191419495e8cdefa381/src/StarRating.tsx#L200-L270) and can compete aggressively with parent scrolling.
- Move calculation reads `nativeEvent.locationX`. React Native documented the moving-target failure in [react-native#15290](https://github.com/react/react-native/issues/15290), and React Native Web documented the same class of problem in [react-native-web#693](https://github.com/necolas/react-native-web/issues/693).
- Selection is limited to the fixed `full`, `half`, and `quarter` modes.
- Every item owns an animation value; the interactive component animates during interaction rather than limiting motion to completion.
- [#78](https://github.com/bviebahn/react-native-star-rating-widget/issues/78) remains open for its Web accessibility prop warning. RTL demand was visible in [#70](https://github.com/bviebahn/react-native-star-rating-widget/issues/70) before automatic support landed.
- Source review suggests repeated controlled drag events can recur while a slow parent still supplies the old `rating`, because deduplication compares against that prop rather than a gesture-local last-emitted tick. This is an inference from source, not a reported issue.

### `@kolking/react-native-rating`

What works well:

- Zero runtime dependencies, polished light/dark variants, exact decimal controlled display, and a compact API.
- It correctly records `pageX - locationX` at grant and uses page coordinates during movement, a sound response to the known `locationX` problem.
- Its README explicitly warns list users about pending callbacks, making the performance tradeoff discoverable.

Verified limitations and pain:

- The root responder always accepts start and returns false from termination requests in [`Rating.tsx`](https://github.com/kolking/react-native-rating/blob/19382752e7a47cd5370d0e5206fc107ad52be3e2/src/Rating.tsx#L64-L137). There is no axis-intent phase for a surrounding ScrollView.
- User input resolves with `Math.ceil` to whole items even though controlled visuals can show decimal fill.
- Disabled/list use still constructs root animated values, and every symbol constructs an animation value in [`RatingSymbol.tsx`](https://github.com/kolking/react-native-rating/blob/19382752e7a47cd5370d0e5206fc107ad52be3e2/src/RatingSymbol.tsx).
- The audited source has no adjustable accessibility node, Web slider semantics, or keyboard handler.
- Reported pain includes coordinate handling [#14](https://github.com/kolking/react-native-rating/issues/14) and [#19](https://github.com/kolking/react-native-rating/issues/19), large-list performance [#15](https://github.com/kolking/react-native-rating/issues/15), and reverse-order demand [#35](https://github.com/kolking/react-native-rating/issues/35). These issues are closed, but they validate the categories.

### `react-native-ratings`

What works well:

- A mature, recognizable API with separate tap and swipe experiences, built-in star/heart/rocket/bell images, custom images, start/swipe/finish callbacks, fractions, minimum values, and Airbnb-style review labels.
- Its long adoption history proves demand for both simple star input and descriptive feedback choices.

Verified limitations and pain:

- The audited 8.1.0 [`SwipeRating`](https://github.com/Monte9/react-native-ratings/blob/0a8f16b4380626556b636e8883b06c0db9e885ec/src/SwipeRating.tsx) creates a PanResponder and new animated objects through its interaction path, measures against window coordinates, and keeps read-only behavior inside the same component.
- Fractional callback and visual behavior diverges for `jumpValue` in open [#155](https://github.com/Monte9/react-native-ratings/issues/155).
- Invalid layout math can reach a native `NaN` width crash: [#183](https://github.com/Monte9/react-native-ratings/issues/183).
- Custom/background image rendering has open reports in [#167](https://github.com/Monte9/react-native-ratings/issues/167), [#175](https://github.com/Monte9/react-native-ratings/issues/175), and [#197](https://github.com/Monte9/react-native-ratings/issues/197).
- Accessibility is still requested in [#172](https://github.com/Monte9/react-native-ratings/issues/172), RTL is still open in [#81](https://github.com/Monte9/react-native-ratings/issues/81), and a negative-to-positive/bidirectional scale is requested in [#189](https://github.com/Monte9/react-native-ratings/issues/189).

These are the strongest issue-backed opportunities because they span correctness, crashes, rendering reliability, accessibility, international layout, and a new semantic job—not cosmetic preference alone.

### React Native Elements Rating

What works well:

- It is discoverable inside a broad design system with current releases and a familiar API.
- The current [`Rating`](https://github.com/react-native-elements/react-native-elements/blob/32ae0eda7c559f55a9d858fc6880ed46f7714c5b/packages/base/src/Rating/Rating.tsx) is small and delegates to the toolkit's swipe-rating implementation.

Verified limitations:

- Installing a UI toolkit is a different dependency decision from adopting a focused core-only control.
- The delegated [`SwipeRating`](https://github.com/react-native-elements/react-native-elements/blob/32ae0eda7c559f55a9d858fc6880ed46f7714c5b/packages/base/src/AirbnbRating/SwipeRating.tsx) retains window-relative measurement and immediate PanResponder acceptance.
- It does not provide a generic semantic scale or a dedicated exact aggregate display component.

### `@rn-vui/ratings`

What works well:

- It modernizes the familiar tap/swipe API with hooks, TypeScript, current tests, and some accessibility state/value coverage.

Verified limitations:

- Its [`SwipeRating`](https://github.com/deepktp/react-native-vikalp-ratings/blob/05783ad7fa318fbe995082fd71f69c4c572fbc25/src/SwipeRating.tsx) adds an Animated listener during render, accepts the responder immediately, and intentionally suppresses hook dependencies around interaction callbacks. Dynamic configuration/callback freshness is therefore risky.
- It retains image masking, window-relative measurement, and the older fractions/jump model.
- Static/read-only content remains in the same swipe implementation rather than a minimal display path.

### `react-native-stars`

What works well:

- A small API, arbitrary partial display, half-star selection, and support for images or React elements.

Verified limitations:

- The [1.2.2 source](https://github.com/Extrct/react-native-stars/blob/8a967ab17462dd1de3af445dd220da6f9197b2a0/index.js) uses class lifecycle code, loose equality, and `value || fallback` selection. A legitimate controlled zero can therefore be replaced by a legacy prop.
- Half selection creates two touchables per star; full selection creates one per star. There is no single slider semantic, drag input, keyboard path, RTL model, or TypeScript contract.
- Its last source release predates the current React 19/React Native architecture.

### `@aashu-dubey/react-native-rating-bar`

What works well:

- The widest layout feature set in the focused competitors: Gesture Handler, tap and pan, half values, minimum/maximum, horizontal, vertical, vertical-reverse, explicit layout direction, and custom elements.

Verified limitations:

- It requires `react-native-gesture-handler`, which is a reasonable choice for complex gesture systems but a meaningful cost for a small form control.
- The audited [`RatingBar.tsx`](https://github.com/Aashu-Dubey/react-native-rating-bar/blob/34fb0cf0c0b38cdf3f8c002d42ef6fc435978175/src/RatingBar.tsx) contains parallel RTL/platform coordinate branches, cloned-element state, and a source TODO noting double-render slowdown during drag callbacks.
- It supports only whole/half selection, and the audited source has no complete adjustable/ARIA keyboard model.

### Older first-page/second-page results

`react-native-star-rating` and `react-native-rating-star` still capture generic search traffic despite 2018 and 2016 latest releases. Their presence is an SEO lesson: an exact package name, a plain-language title, installation snippet, and stable repository history can rank for years. Their image/vector-icon installation, per-star press targets, and older React APIs are not an implementation baseline for the next version.

## What to borrow

These are product lessons, not copied source:

| Lesson | Evidence | Adaptation here |
| --- | --- | --- |
| Separate interactive and static jobs | `react-native-star-rating-widget` has `StarRatingDisplay`; FlatList demand appears in local #14 | First-class `RatingDisplay`, exact by default and free of interaction allocations |
| Make interaction lifecycle explicit | Widget and Monte packages expose start/move/end phases | `onInteractionStart`, distinct `onChange`, and one `onChangeEnd` with source/cancellation |
| Custom visuals are table stakes | Widget icon component, Kolking symbols, Monte custom image, local #8 | Typed render slots that also expose fractional fill, direction, and pressed state |
| RTL and vertical layout must be intentional | Widget/Kolking RTL work, Aashu direction matrix, multiple RTL issues | `direction`, `orientation`, and semantic `reversed` are separate concepts |
| Descriptive feedback is more valuable than stars alone | Airbnb review labels and Monte #189 | Generic `RatingScale` for NPS, Likert, emoji, zero, negatives, and strings |
| A focused component should be easy to adopt | Kolking's zero-dependency pitch | Core React Native implementation with no required icon, SVG, or gesture package |
| Arbitrary aggregate display matters | Kolking and `react-native-stars` render decimals | Exact `RatingDisplay` fill, while interactive snapping remains explicit |

## What this package can offer that the audited hits cannot

The defensible differentiation is the combination, not a longer prop list:

1. **Scroll-aware drag intent.** One root state machine waits for slop and primary-axis dominance, permits responder termination before lock, and retains only a deliberate rating drag.
2. **One value model end to end.** Integer ticks drive pointer selection, keyboard actions, native accessibility values, callback deduplication, and fractional visual fill. This directly targets the verified visual/callback divergence class.
3. **Accessibility parity, not a label.** One native adjustable control, direct Web ARIA slider attributes, standard keyboard keys, localized value text, visible focus, non-color-only star shapes, and reduced-motion behavior.
4. **A real static architecture.** `RatingDisplay` and read-only scales do not merely disable an interactive implementation. That directly serves FlatList/SectionList use.
5. **Semantic ratings.** `RatingScale` does not overload zero as “empty,” so NPS zero and negative-to-positive scales work without sentinel collisions.
6. **Independent layout semantics.** Locale direction, interaction orientation, bottom-to-top vertical progression, fill origin, and semantic reversal are explicit and testable. `reversed` remaps semantic items rather than adding conflicting coordinate branches.
7. **Core-only customization.** The default works without setup, while render slots accept the user's existing icon/SVG/design system instead of choosing one for them.
8. **Defensive boundaries.** Invalid values, counts, sizes, steps, duplicate scale items, gaps, and measured extents normalize before reaching native styles, targeting the verified `NaN` crash class.
9. **Semantic content that can fit.** `itemExtent` gives horizontal labels more primary-axis room without inflating visual size or the cross-axis target, while the same value is available to custom renderers.
10. **Intentional duplicate semantics.** Static aggregate and read-only scale visuals can be marked `decorative` when adjacent text already communicates their value; interactive controls remain one focusable slider.

## Positioning and SEO plan

### Search promise

Lead with one sentence everywhere:

> Accessible React Native star rating, drag rating, and semantic feedback scale for iOS, Android, Expo, and React Native Web.

The supporting proof line is: fractional, RTL, Web keyboard-ready, and zero runtime dependencies.

It contains the high-intent terms without keyword stuffing:

- React Native rating component
- React Native star rating
- React Native drag/swipe rating
- Expo rating component
- React Native Web rating
- accessible/keyboard rating
- fractional/half-star rating
- RTL/vertical rating
- NPS, Likert, and emoji rating scale
- FlatList rating display

### Proof before superlatives

Do not call the package “the best” as an unsupported claim. Show the difference:

- a short clip of a horizontal rating inside a vertical ScrollView;
- keyboard + two-color focus-indicator interaction in the Web example;
- VoiceOver/TalkBack adjustable actions;
- exact `4.37` display in a large FlatList;
- LTR, RTL, vertical, and reversed semantic scale in one layout;
- NPS `0` and a `-2…2` scale proving the null-sentinel design;
- reduced-motion on/off behavior.

The README comparison must stay versioned and sourced. Re-audit it for every major release rather than letting competitor claims go stale.

### Conversion path

1. The npm/GitHub fold answers compatibility, install, and a controlled five-star example.
2. The next screen proves the unique jobs: drag, `RatingDisplay`, and `RatingScale`.
3. Copy-paste examples cover the exact search intents above.
4. Callback documentation tells teams where to put state versus persistence.
5. The architecture document provides trust for maintainers evaluating gesture correctness, performance, and accessibility.

### Release launch

- Publish one integrated next version and one changelog story; do not fragment the message across interim releases.
- Create a concise demonstration asset and deploy a live Expo/Web example before adding a public link. The repository currently provides the local Expo example plus packed-package Web export and server-render smoke coverage; it does not yet claim a deployed demo URL.
- Announce the issue-backed outcomes: half/fractional fill, custom components, minimum ratings, FlatList display, RTL, accessibility, and semantic scales.
- Link the resolved local issues and thank the original reporters.
- Share factual implementation notes with React Native/Expo communities: coordinate math, ScrollView coexistence, Web slider semantics, and the static-path performance design are useful even to non-users.

### Measures

Capture a release-day baseline and review at 7, 30, and 90 days:

- npm weekly downloads and dependent count;
- GitHub clone/traffic, stars, and README-to-install conversion where available;
- search position for the query families in the audit;
- example visits and completion of the live rating demo once a public deployment exists;
- issue mix: defects versus setup questions versus feature requests;
- bundle/package size and list-render benchmark regressions.

Growth is not evidence of correctness. Accessibility checks, package compatibility, issue recurrence, and crash-free usage remain release guardrails.

## Primary implementation guidance

The product decisions were checked against current primary guidance:

- [React Native Gesture Responder System](https://reactnative.dev/docs/gesture-responder-system)
- [React Native PanResponder](https://reactnative.dev/docs/panresponder)
- [React Native Animated](https://reactnative.dev/docs/animated)
- [React Native performance overview](https://reactnative.dev/docs/performance)
- [React Native accessibility](https://reactnative.dev/docs/accessibility)
- [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
- [React Native I18nManager](https://reactnative.dev/docs/i18nmanager)
- [React Native Web interactions](https://necolas.github.io/react-native-web/docs/interactions/)
- [React Native Web accessibility](https://necolas.github.io/react-native-web/docs/accessibility/)
- [WAI-ARIA Authoring Practices slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)
- [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android accessible view guidance](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views?hl=en)
- [WCAG 2.2 non-text contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)
- [WCAG 2.2 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)

The corresponding implementation invariants and release gates live in [ARCHITECTURE.md](./ARCHITECTURE.md).

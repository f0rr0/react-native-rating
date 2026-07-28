#!/usr/bin/env bash

set -euo pipefail

: "${PACKAGE_TARBALL:?PACKAGE_TARBALL is required}"

example_directory="$(mktemp -d)"
trap 'rm -rf -- "$example_directory"' EXIT

cp -R example/. "$example_directory"

PACKAGE_TARBALL="$(realpath "$PACKAGE_TARBALL")" \
  EXAMPLE_DIRECTORY="$example_directory" \
  node --input-type=module <<'NODE'
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const packagePath = join(
  process.env.EXAMPLE_DIRECTORY,
  "package.json"
);
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.dependencies["react-native-rating"] =
  `file:${process.env.PACKAGE_TARBALL}`;
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
NODE

(
  cd "$example_directory"
  bun install --ignore-scripts
  bun run typecheck
  bun run export:web
  test -s dist/index.html

  mv node_modules/react-native node_modules/react-native-native
  ln -s react-native-web node_modules/react-native

  node --input-type=module <<'NODE'
import assert from "node:assert/strict";

const diagnostics = [];
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...messages) => {
  diagnostics.push(messages.join(" "));
};
console.warn = (...messages) => {
  diagnostics.push(messages.join(" "));
};

try {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { StyleSheet } = await import("react-native");
  const { Rating, RatingDisplay, RatingScale } =
    await import("react-native-rating");

  const slider = renderToStaticMarkup(
    createElement(Rating, {
      animated: false,
      interactionMode: "tap-and-drag",
      step: 0.5,
      testID: "rating",
      value: 2.5,
    })
  );
  const decorative = renderToStaticMarkup(
    createElement(RatingDisplay, {
      decorative: true,
      testID: "display",
      value: 4.37,
    })
  );
  const scale = renderToStaticMarkup(
    createElement(RatingScale, {
      animated: false,
      items: [
        { label: "Negative", value: -1 },
        { label: "Neutral", value: 0 },
        { label: "Positive", value: 1 },
      ],
      testID: "scale",
      value: 0,
    })
  );
  const styleSheet = StyleSheet.getSheet();
  const getTag = (markup, testID) => {
    const tag = markup.match(
      new RegExp(`<[^>]*data-testid="${testID}"[^>]*>`, "u")
    )?.[0];

    assert.ok(tag, `Missing rendered element: ${testID}`);
    return tag;
  };
  const hasPointerClass = (
    markup,
    testID,
    rootPointerEvents,
    childPointerEvents
  ) => {
    const tag = getTag(markup, testID);
    const classNames = tag.match(/class="([^"]+)"/u)?.[1]?.split(/\s+/u) ?? [];

    return classNames.some(
      (className) =>
        styleSheet.textContent.includes(
          `.${className}{pointer-events:${rootPointerEvents}!important;}`
        ) &&
        styleSheet.textContent.includes(
          `.${className}>* {pointer-events:${childPointerEvents};}`
        )
    );
  };

  assert.match(slider, /role="slider"/u);
  assert.match(slider, /aria-valuenow="2.5"/u);
  assert.doesNotMatch(slider, /pointer-events:box-only/u);
  assert.equal(
    hasPointerClass(slider, "rating-control", "auto", "none"),
    true
  );
  assert.match(decorative, /aria-hidden="true"/u);
  assert.doesNotMatch(decorative, /role="img"/u);
  assert.equal(
    hasPointerClass(decorative, "display-control", "none", "none"),
    true
  );
  assert.match(scale, /role="slider"/u);
  assert.match(scale, /aria-valuenow="2"/u);
  assert.match(scale, /aria-valuetext="Neutral"/u);
  assert.deepEqual(diagnostics, []);
} finally {
  console.error = originalError;
  console.warn = originalWarn;
}
NODE
)

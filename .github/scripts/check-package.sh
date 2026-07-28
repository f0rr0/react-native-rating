#!/usr/bin/env bash

set -euo pipefail

: "${PACKAGE_TARBALL:?PACKAGE_TARBALL is required}"
: "${REACT_NATIVE_VERSION:?REACT_NATIVE_VERSION is required}"
: "${REACT_TYPES_VERSION:?REACT_TYPES_VERSION is required}"
: "${REACT_VERSION:?REACT_VERSION is required}"

if test "$REACT_NATIVE_VERSION" = "current"; then
  REACT_NATIVE_VERSION="$(
    node -p "require('./package.json').devDependencies['react-native']"
  )"
  REACT_TYPES_VERSION="$(
    node -p "require('./package.json').devDependencies['@types/react']"
  )"
  REACT_VERSION="$(node -p "require('./package.json').devDependencies.react")"
fi

TYPESCRIPT_VERSION="$(
  node -p "require('./package.json').devDependencies.typescript"
)"

consumer_directory="$(mktemp -d)"
trap 'rm -rf -- "$consumer_directory"' EXIT

cp -R .github/fixtures/consumer/. "$consumer_directory"

(
  cd "$consumer_directory"
  bun add \
    --exact \
    --ignore-scripts \
    "$PACKAGE_TARBALL" \
    "@types/react@$REACT_TYPES_VERSION" \
    "react@$REACT_VERSION" \
    "react-native@$REACT_NATIVE_VERSION" \
    "typescript@$TYPESCRIPT_VERSION"

  ./node_modules/.bin/tsc --project tsconfig.json

  node --input-type=module <<'NODE'
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const commonjsEntry = require.resolve("react-native-rating");
const moduleEntry = import.meta.resolve("react-native-rating");

if (!commonjsEntry.endsWith("/lib/commonjs/index.js")) {
  throw new Error(`Unexpected CommonJS entry: ${commonjsEntry}`);
}

if (!moduleEntry.endsWith("/lib/module/index.js")) {
  throw new Error(`Unexpected module entry: ${moduleEntry}`);
}
NODE
)

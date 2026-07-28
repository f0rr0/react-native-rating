const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList =
  require("metro-config/private/defaults/exclusionList").default;

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const installedPackageRoot = path.join(
  projectRoot,
  "node_modules/react-native-rating"
);

const config = getDefaultConfig(projectRoot);
const escapePath = (value) =>
  value.replaceAll("\\", "\\\\").replace(/[|\\{}()[\]^$+*?.]/gu, "\\$&");

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot])
);

config.resolver = {
  ...config.resolver,
  blockList: exclusionList([
    new RegExp(
      `${escapePath(path.join(installedPackageRoot, "node_modules/react"))}(/.*)?$`
    ),
    new RegExp(
      `${escapePath(path.join(installedPackageRoot, "node_modules/react-native"))}(/.*)?$`
    ),
    new RegExp(
      `${escapePath(path.join(installedPackageRoot, "example/node_modules/react"))}(/.*)?$`
    ),
  ]),
  disableHierarchicalLookup: true,
  extraNodeModules: {
    ...(config.resolver.extraNodeModules ?? {}),
    react: path.join(projectRoot, "node_modules/react"),
    "react/jsx-dev-runtime": path.join(
      projectRoot,
      "node_modules/react/jsx-dev-runtime"
    ),
    "react/jsx-runtime": path.join(
      projectRoot,
      "node_modules/react/jsx-runtime"
    ),
    "react-native": path.join(projectRoot, "node_modules/react-native"),
  },
  nodeModulesPaths: [
    path.join(projectRoot, "node_modules"),
    path.join(workspaceRoot, "node_modules"),
  ],
};

module.exports = config;

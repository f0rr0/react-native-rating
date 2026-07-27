const NODE_MODULES_PATTERN = /[\\/]node_modules[\\/]/u;

module.exports = {
  overrides: [
    {
      exclude: NODE_MODULES_PATTERN,
      presets: ["module:react-native-builder-bob/babel-preset"],
    },
    {
      include: NODE_MODULES_PATTERN,
      presets: ["module:@react-native/babel-preset"],
    },
  ],
};

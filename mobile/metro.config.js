const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Import .svg files as React components (used for the Geostat wordmark and flags).
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;

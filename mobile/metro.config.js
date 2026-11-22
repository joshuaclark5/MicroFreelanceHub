const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '..')];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
// Preserve nested React Native dependencies; shared parent files are pure TS.
config.resolver.disableHierarchicalLookup = false;
module.exports = config;

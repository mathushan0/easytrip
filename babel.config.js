module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@theme': './src/theme',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@stores': './src/stores',
            '@lib': './src/lib',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

const path = require('path');

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'plugin-timed-commit-status.js',
    path: path.resolve(__dirname, 'dist'),
    library: { type: 'window' },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  // react-dom is intentionally absent: this plugin never mounts its own root,
  // only react needs to resolve to the host page's global.
  externals: {
    react: 'React',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: { compilerOptions: { noEmit: false } },
        },
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'production',
};

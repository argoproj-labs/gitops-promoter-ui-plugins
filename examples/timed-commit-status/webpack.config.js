const path = require('path');

// Two identical builds from the same entry point, under two different names:
// the promoter's dashboard (build-embed and --plugins-dir) only picks up
// files matching `plugin*.js`, while Argo CD's own server (serving
// /extensions.js to argocd-extension-installer-loaded init containers) only
// picks up files matching `extension*.js`. Neither glob is configurable from
// here, so one plugin ships as both filenames rather than forcing a single
// name to satisfy both.
const targets = ['plugin-timed-commit-status.js', 'extension-plugin-timed-commit-status.js'];

module.exports = targets.map((filename) => ({
  entry: './src/index.tsx',
  output: {
    filename,
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
}));

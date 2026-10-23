import {existsSync, readdirSync} from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'

import rspack from '@rspack/core'
import {ReactRefreshRspackPlugin} from '@rspack/plugin-react-refresh'
import {sentryWebpackPlugin} from '@sentry/webpack-plugin'
import dotenv from 'dotenv'
import {RspackManifestPlugin} from 'rspack-manifest-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'

import {browserslist, version} from './package.json'

dotenv.config({path: path.resolve(__dirname, '.env')})

const GENERATE_STATS = process.env.GENERATE_STATS === '1'
const isProduction = process.env.NODE_ENV === 'production'
const sentryAuthToken =
  process.env.SENTRY_AUTH_TOKEN === 'unknown'
    ? undefined
    : process.env.SENTRY_AUTH_TOKEN
const oauthRequire = createRequire(require.resolve('@atproto/oauth-client-browser'))
const oauthClientRequire = createRequire(oauthRequire.resolve('@atproto/oauth-client'))

// Collect all EXPO_PUBLIC_* env vars so they're available at build time,
// mirroring what @expo/webpack-config does automatically.
const expoPublicEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith('EXPO_PUBLIC_'))
    .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
)

// Packages in node_modules that ship untranspiled JSX/Flow/modern syntax
// and need to be run through SWC.
const TRANSPILE_MODULES = {
  prefixes: [
    'react-native',
    'react-native-web',
    'expo',
    'unimodules',
    'react-navigation',
  ],
  scopes: [
    '@react-native',
    '@react-native-community',
    '@expo',
    '@unimodules',
    '@bsky.app',
    '@discord',
    '@react-navigation',
  ],
  packages: [
    'native-base',
    'normalize-url',
    '@sentry/react-native',
    'sentry-expo',
    'bcp-47-match',
    'nanoid',
  ],
}

function getTranspileModuleDirs({
  prefixes,
  scopes,
  packages,
}: typeof TRANSPILE_MODULES) {
  const nodeModulesDir = path.resolve(__dirname, 'node_modules')
  const dirs = new Set<string>()

  const readDirNames = (dir: string) => {
    if (!existsSync(dir)) return []
    return readdirSync(dir, {withFileTypes: true})
      .filter(entry => entry.isDirectory() || entry.isSymbolicLink())
      .map(entry => entry.name)
  }

  for (const entry of readDirNames(nodeModulesDir)) {
    if (
      prefixes.some(
        prefix => entry === prefix || entry.startsWith(`${prefix}-`),
      )
    ) {
      dirs.add(path.join(nodeModulesDir, entry))
    }
  }

  for (const scope of scopes) {
    const scopeDir = path.join(nodeModulesDir, scope)
    for (const entry of readDirNames(scopeDir)) {
      dirs.add(path.join(scopeDir, entry))
    }
  }

  for (const pkg of packages) {
    const pkgDir = path.join(nodeModulesDir, ...pkg.split('/'))
    if (existsSync(pkgDir)) {
      dirs.add(pkgDir)
    }
  }

  return [...dirs]
}

const transpileModuleDirs = getTranspileModuleDirs(TRANSPILE_MODULES)
const REANIMATED_BABEL_MODULES = ['react-native-keyboard-controller']
const reanimatedBabelModuleDirs = REANIMATED_BABEL_MODULES.map(pkg =>
  path.resolve(__dirname, 'node_modules', ...pkg.split('/')),
).filter(existsSync)
const SWC_TRANSPILE_EXCLUDE = /node_modules[\\/]react-native-uuid[\\/]/
const REANIMATED_BABEL_EXCLUDE =
  /node_modules[\\/]react-native-keyboard-controller[\\/]/

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  mode: isProduction ? 'production' : 'development',
  // Avoid eval-based sourcemaps in development. Firefox resolves relative
  // sourcemap URLs from injected devtools scripts like `installHook.js.map`
  // against an `<anonymous code>` URL when the bundle is eval-backed, which
  // produces noisy 404s in the console.
  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',

  entry: {
    main: path.resolve(__dirname, 'index.web.ts'),
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction
      ? 'static/js/[name].[contenthash:8].js'
      : 'static/js/[name].js',
    cssFilename: isProduction
      ? 'static/css/[name].[contenthash:8].css'
      : 'static/css/[name].css',
    cssChunkFilename: isProduction
      ? 'static/css/[name].[contenthash:8].chunk.css'
      : 'static/css/[name].chunk.css',
    chunkFilename: isProduction
      ? 'static/js/[name].[contenthash:8].chunk.js'
      : 'static/js/[name].chunk.js',
    assetModuleFilename: 'static/media/[name].[hash:8][ext]',
    publicPath: '/',
    clean: true,
  },

  resolve: {
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      '.web.jsx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    alias: {
      // Path alias for src/
      '#': path.resolve(__dirname, 'src'),
      // React Native Web
      'react-native$': 'react-native-web',
      // SVG's web image resolver shares React Native Web's asset registry.
      '@react-native/assets-registry/registry':
        'react-native-web/dist/modules/AssetRegistry',
      // This Android-only sound module is statically imported by SVG on web.
      '../fabric/NativeSvgSoundModule': false,
      // Both OAuth barrels re-export this package; resolve them to one instance.
      '@atproto/did$': oauthClientRequire.resolve('@atproto/did'),
      // Internal RN module mappings for compatibility
      'react-native/Libraries/Components/View/ViewStylePropTypes$':
        'react-native-web/dist/exports/View/ViewStylePropTypes',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$':
        'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter',
      // Webview shim
      'react-native-webview': 'react-native-web-webview',
      // Crypto shim for expo-modules-core
      crypto: path.resolve(__dirname, 'src/platform/crypto.ts'),
      // Force ESM version of unicode-segmenter
      'unicode-segmenter/grapheme': require
        .resolve('unicode-segmenter/grapheme')
        .replace(/\.cjs$/, '.js'),
      // Block packages that should not load on web
      'react-native-gesture-handler': false,
      '@sentry-internal/replay': false,
      // Sentry probes this optional Expo Router store inside a try/catch. This
      // app uses React Navigation directly, so resolve the probe to an empty
      // module instead of emitting a missing-module warning on every web build.
      'expo-router/build/global-state/router-store': false,
    },
    mainFields: ['browser', 'module', 'main'],
    // Allow importing without file extensions in ESM packages
    fullySpecified: false,
    symlinks: false, // Don't resolve symlinks to support pnpm's node_modules structure
  },

  module: {
    rules: [
      // Disable fullySpecified for ESM packages that import without extensions
      // (e.g. react-navigation importing react-native-web/dist/exports/Platform)
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      // Published ESM also needs transforms for the supported browser versions.
      {
        test: /\.m?js$/,
        include: /node_modules/,
        exclude: [...transpileModuleDirs, ...reanimatedBabelModuleDirs],
        use: {
          loader: 'builtin:swc-loader',
          options: {
            env: {targets: browserslist.production},
          },
        },
      },
      // Source files: use babel-loader for lingui macros, react-compiler, etc.
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: false, // Don't look for a babel.config.json to avoid conflicts with the one in the root of the monorepo.
            babelrc: false,
            cacheDirectory: true,
            cacheCompression: false, // let rspack handle it
            sourceType: 'unambiguous',
            caller: {name: 'babel-loader', bundler: 'webpack', platform: 'web'},
            // based on babel.config.js but optimized for web and rspack
            presets: [
              [
                'babel-preset-expo',
                {
                  lazyImports: true,
                  native: {
                    // Disable ESM -> CJS compilation because rspack handles it.
                    disableImportExportTransform: true,
                  },
                },
              ],
            ],
            plugins: [
              '@lingui/babel-plugin-lingui-macro',
              ['babel-plugin-react-compiler', {target: '19'}],
              // omitted: react-native-dotenv (we use DefinePlugin instead)
              // omitted: module-resolver (we use rspack's built-in aliasing instead)
              !isProduction && 'react-refresh/babel',
              'react-native-worklets/plugin', // NOTE: this plugin MUST be last
            ].filter(Boolean),
            env: {
              production: {
                plugins: [], // omitted: transform-remove-console
              },
            },
          },
        },
      },
      // Some published packages ship raw `"worklet"` functions and must go
      // through Babel with the Reanimated plugin on web, matching Expo's
      // webpack pipeline. SWC alone leaves those functions unworkletized.
      {
        test: /\.[jt]sx?$/,
        include: reanimatedBabelModuleDirs,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: false,
            babelrc: false,
            cacheDirectory: true,
            cacheCompression: false,
            sourceType: 'unambiguous',
            caller: {name: 'babel-loader', bundler: 'webpack', platform: 'web'},
            presets: [
              [
                'babel-preset-expo',
                {
                  lazyImports: true,
                  native: {
                    disableImportExportTransform: true,
                  },
                },
              ],
            ],
            plugins: ['react-native-worklets/plugin'],
          },
        },
      },
      // node_modules that ship untranspiled JSX/Flow: use rspack's builtin
      // SWC loader which is much faster than babel for simple transforms.
      {
        test: /\.jsx?$/,
        include: transpileModuleDirs,
        exclude: [SWC_TRANSPILE_EXCLUDE, REANIMATED_BABEL_EXCLUDE],
        use: {
          loader: 'swc-loader', // rspack swc-loader doesn't support flow yet
          options: {
            env: {targets: browserslist.production},
            jsc: {
              parser: {
                syntax: 'flow',
                jsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
      {
        test: /\.tsx?$/,
        include: transpileModuleDirs,
        exclude: [SWC_TRANSPILE_EXCLUDE, REANIMATED_BABEL_EXCLUDE],
        use: {
          loader: 'swc-loader',
          options: {
            env: {targets: browserslist.production},
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
      // HTML file loader for react-native-web-webview's postMock.html
      {
        test: /postMock\.html$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name][ext]',
        },
      },
      // CSS support — imported from JS/TS files
      {
        test: /\.css$/,
        type: 'css/auto',
      },
      // Image assets
      {
        test: /\.(bmp|gif|jpe?g|png|svg|avif|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8KB
          },
        },
      },
      // Font assets
      {
        test: /\.(woff|woff2|otf|ttf|eot)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    GENERATE_STATS &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsFilename: 'stats.json',
      }),
    new rspack.HtmlRspackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      inject: true,
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        // Include public link-preview routes as well as internal crawler routes.
        {from: 'public/_routes.json', to: '_routes.json'},
        {from: 'public/_headers', to: '_headers', toType: 'file'},
        {from: 'bskyweb/static/robots.txt', to: 'robots.txt'},
        {from: 'assets/favicon.png', to: 'favicon.ico'},
        // Serve fonts at /static/fonts/ with stable names
        {from: 'public/static/fonts', to: 'static/fonts'},
        // Serve the global stylesheet
        {from: 'src/style.css', to: 'static/style.css'},
      ],
    }),
    new rspack.DefinePlugin({
      __DEV__: JSON.stringify(!isProduction),
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(
        isProduction ? 'production' : 'development',
      ),
      'process.env.JEST_WORKER_ID': JSON.stringify(undefined),
      'process.env.LIVE_EVENTS_DEV_URL': JSON.stringify(
        process.env.LIVE_EVENTS_DEV_URL || '',
      ),
      'process.env.APP_CONFIG_DEV_URL': JSON.stringify(
        process.env.APP_CONFIG_DEV_URL || '',
      ),
      // provide sensible defaults for env vars that the web build expects but aren't defined in the environment
      'process.env.EXPO_PUBLIC_ENV': JSON.stringify(
        isProduction ? 'production' : 'development',
      ),
      'process.env.EAS_BUILD_PLATFORM': JSON.stringify('web'),
      'process.env.SENTRY_AUTH_TOKEN': 'undefined',
      'process.env.EXPO_PUBLIC_RELEASE_VERSION': 'undefined',
      'process.env.EXPO_PUBLIC_LOG_LEVEL': '"debug"',
      'process.env.EXPO_PUBLIC_LOG_DEBUG': '"*"',
      'process.env.EXPO_PUBLIC_OAUTH_BASE_URL': 'undefined',
      'process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME': 'undefined',
      'process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER': 'undefined',
      'process.env.EXPO_PUBLIC_BUNDLE_DATE': 'undefined',
      'process.env.EXPO_PUBLIC_SENTRY_DSN': 'undefined',
      'process.env.EXPO_PUBLIC_BLUESKY_PROXY_DID': 'undefined',
      'process.env.EXPO_PUBLIC_CHAT_PROXY_DID': 'undefined',
      'process.env.EXPO_PUBLIC_METRICS_API_HOST': 'undefined',
      'process.env.EXPO_PUBLIC_GROWTHBOOK_API_HOST': 'undefined',
      'process.env.EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY': 'undefined',
      'process.env.EXPO_PUBLIC_BITDRIFT_API_KEY': 'undefined',
      'process.env.EXPO_PUBLIC_GCP_PROJECT_ID': 'undefined',
      'process.env.EXPO_PUBLIC_PUBLIC_BSKY_SERVICE': 'undefined',
      'process.env.EXPO_PUBLIC_APPVIEW_DID_PROXY': 'undefined',
      'process.env.APP_MANIFEST': 'undefined',
      'process.env.__SENTRY_METRO_DEV_SERVER__': 'undefined',
      'process.env.EXPO_OS': JSON.stringify('web'),
      // Holy shit I fucking HATE React Native but here we fuckin go
      'process.env.EXPO_SERVER': 'false',
      // Inject all EXPO_PUBLIC_* env vars
      ...expoPublicEnv,
    }),
    // Generate asset-manifest.json matching the format the Go server expects.
    // The post-web-build script reads `entrypoints` from this manifest.
    new RspackManifestPlugin({
      fileName: 'asset-manifest.json',
      generate: (seed, files, entrypoints) => {
        const entrypointFiles = entrypoints.main || []
        return {
          files: files.reduce((manifest, file) => {
            manifest[file.name] = file.path
            return manifest
          }, seed),
          entrypoints: entrypointFiles.filter(f => !f.endsWith('.map')),
        }
      },
    }),
    // Sentry source maps
    isProduction &&
      sentryAuthToken &&
      sentryWebpackPlugin({
        org: 'blueskyweb',
        project: 'app',
        authToken: sentryAuthToken,
        release: {
          name:
            process.env.SENTRY_RELEASE ||
            `xyz.blueskyweb.app@${process.env.EXPO_PUBLIC_RELEASE_VERSION || version}`,
          dist: process.env.SENTRY_DIST,
        },
      }),
    !isProduction && new ReactRefreshRspackPlugin(),
  ].filter(Boolean),

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-native-web|@react-navigation|expo|@expo)[\\/]/,
          name: 'framework',
          chunks: 'initial',
          priority: 20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'initial',
          priority: -10,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
    minimize: isProduction,
  },

  devServer: {
    static: {
      directory: path.resolve(__dirname, 'public'),
    },
    port: 19006,
    hot: true,
    historyApiFallback: {
      // Handles like `xan.lol` contain dots, which the default history
      // fallback treats as asset requests instead of app routes.
      disableDotRule: true,
    },
    compress: true,
  },

  // Don't bundle node built-ins (shouldn't be needed on web)
  externalsPresets: {node: false},
  node: {
    __filename: false,
  },

  stats: GENERATE_STATS ? 'verbose' : 'normal',

  experiments: {
    css: true,
  },
}

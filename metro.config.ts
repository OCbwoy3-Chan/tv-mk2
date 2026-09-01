// Learn more https://docs.expo.io/guides/customizing-metro
import {type CustomResolver} from '@expo/metro/metro-resolver'
import {getDefaultConfig} from '@expo/metro-config'
import {getSentryExpoConfig} from '@sentry/react-native/metro.js'

const config = getSentryExpoConfig(import.meta.dirname, {
  // TODO: confirm this doesn't break anything when we switch to metro web
  includeWebReplay: false,
  annotateReactComponents: {
    textComponentNames: ['Text', 'ButtonText'],
  },
  getDefaultConfig: (projectRoot, options) => {
    const config = getDefaultConfig(projectRoot, options)

    if (typeof process.env.RN_SRC_EXT === 'string') {
      // inject `.e2e.ts` and `.e2e.tsx` into the sourceExts when running tests)
      config.resolver.sourceExts.unshift(...process.env.RN_SRC_EXT.split(','))
    }

    config.resolver.assetExts = [...config.resolver.assetExts, 'woff2']

    if (config.resolver.resolveRequest) {
      throw Error('Update this override because it is conflicting now.')
    }

    // Metro selects jose's Node entry because its resolver does not provide
    // the `browser` export condition. The Node entry imports `node:crypto`,
    // which is unavailable in React Native. Use jose's WebCrypto build for
    // native bundles instead.
    const joseBrowserEntry = `${import.meta.dirname}/node_modules/jose/dist/browser/index.js`
    const resolveRequest: CustomResolver = (context, moduleName, platform) => {
      if (platform !== 'web' && moduleName === 'jose') {
        return {type: 'sourceFile', filePath: joseBrowserEntry}
      }
      return context.resolveRequest(context, moduleName, platform)
    }

    // @ts-expect-error readonly property
    config.resolver.resolveRequest = resolveRequest

    if (process.env.BSKY_PROFILE) {
      // @ts-expect-error readonly property
      config.cacheVersion += ':PROFILE'

      const profileResolver: CustomResolver = (
        context,
        moduleName,
        platform,
      ) => {
        if (moduleName.endsWith('ReactNativeRenderer-prod')) {
          return context.resolveRequest(
            context,
            moduleName.replace('-prod', '-profiling'),
            platform,
          )
        }
        return resolveRequest(context, moduleName, platform)
      }

      // @ts-expect-error readonly property
      config.resolver.resolveRequest = profileResolver
    }

    config.transformer.getTransformOptions = () =>
      Promise.resolve({
        transform: {
          experimentalImportSupport: true,
          inlineRequires: true as false, // ??? typescript why?
        },
      })

    return config as unknown as Record<string, unknown>
  },
})

export default config

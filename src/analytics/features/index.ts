import {MMKV} from 'react-native-mmkv'
import {setPolyfills} from '@growthbook/growthbook'
import {GrowthBook} from '@growthbook/growthbook-react'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {getNavigationMetadata, type Metadata} from '#/analytics/metadata'
import {Features} from '#/analytics/features/types'
import * as env from '#/env'

export {Features} from '#/analytics/features/types'

const CACHE = new MMKV({id: 'bsky_features_cache'})

const BETA_USER_ATTRIBUTE = 'isBetaUser'

setPolyfills({
  localStorage: {
    getItem: key => {
      return CACHE.getString(key) ?? null
    },
    setItem: (key, value) => {
      CACHE.set(key, value)
    },
  },
})

/**
 * We vary the amount of time we wait for GrowthBook to fetch feature
 * gates based on the strategy specified.
 */
export type FeatureFetchStrategy = 'prefer-low-latency' | 'prefer-fresh-gates'

export const features = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  enableDevMode: env.IS_INTERNAL,
})

/**
 * Kept as a resolved promise so existing startup code can await it without
 * triggering any remote GrowthBook fetches.
 */
export const init = Promise.resolve()

export function setForcedFeatureValues(overrides?: Record<string, boolean>) {
  features.setForcedFeatures(new Map(Object.entries(overrides ?? {})))
}

/**
 * Refresh feature gates from GrowthBook.
 */
export async function refresh(_: {strategy: FeatureFetchStrategy}) {}

export function getFeatures() {
  return features.getFeatures()
}

export function getFeatureDescription(feature: Features, i18n: I18n) {
  switch (feature) {
    case Features.PostThreadKnownLikersEnable:
      return {
        key: feature,
        name: i18n._(
          msg({
            message: 'Social proofing on posts',
            comment: 'Name for a feature flag',
          }),
        ),
        description: i18n._(
          msg({
            message: 'Spot posts your friends and follows have liked.',
            comment: 'Description of a feature flag (Social proofing on posts)',
          }),
        ),
      }
    default:
      return null
  }
}

/**
 * Walks a GrowthBook condition tree to determine whether it targets the given
 * attribute. Conditions can nest via the logical operators `$and`, `$or`,
 * `$nor` (arrays of sub-conditions) and `$not` (a single sub-condition), so a
 * flat scan of the top-level keys would miss e.g.
 * `{$and: [{isBetaUser: true}, ...]}`. Dot-notation access (e.g.
 * `isBetaUser.foo`) counts as targeting the attribute as well.
 */
function conditionTargetsAttribute(
  condition: unknown,
  attribute: string,
): boolean {
  if (!condition || typeof condition !== 'object') return false

  for (const [key, value] of Object.entries(condition)) {
    if (key === attribute || key.startsWith(`${attribute}.`)) return true

    if (key === '$and' || key === '$or' || key === '$nor') {
      if (
        Array.isArray(value) &&
        value.some(sub => conditionTargetsAttribute(sub, attribute))
      ) {
        return true
      }
    } else if (key === '$not') {
      if (conditionTargetsAttribute(value, attribute)) return true
    }
  }

  return false
}

export function getTargetedFeatures(i18n: I18n) {
  const allFeatures = features.getFeatures()
  const targetedFeatures: {key: Features; name: string; description: string}[] =
    []
  for (const [featureKey, feature] of Object.entries(allFeatures)) {
    // Check if the feature contains any rules
    if (!feature.rules) continue

    // Determine if any rule targets the beta user attribute
    const hasTargeting = feature.rules.some(rule =>
      conditionTargetsAttribute(rule.condition, BETA_USER_ATTRIBUTE),
    )

    if (hasTargeting) {
      const featureName = getFeatureDescription(featureKey as Features, i18n)
      if (featureName) {
        targetedFeatures.push(featureName)
      }
    }
  }

  return targetedFeatures
}

/**
 * Converts our metadata into GrowthBook attributes and sets them. GrowthBook
 * attributes are manually configured in the GrowthBook dashboard. So these
 * values need to match exactly. Therefore, let's add them here manually to and
 * not spread them to avoid mistakes.
 */
export function setAttributes({
  base,
  geolocation,
  session,
  preferences,
}: Metadata) {
  void features.setAttributes({
    deviceId: base.deviceId,
    sessionId: base.sessionId,
    platform: base.platform,
    appVersion: base.appVersion,
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
    did: session?.did,
    isBskyPds: session?.isBskyPds,
    appLanguage: preferences?.appLanguage,
    contentLanguages: preferences?.contentLanguages,
    currentScreen: getNavigationMetadata()?.currentScreen,
    isBetaUser: base.isBetaUser,
  })
}

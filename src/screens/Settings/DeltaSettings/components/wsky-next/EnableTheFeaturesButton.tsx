import {Button, ButtonText} from '#/components/Button'
import {Features, getFeatures} from '#/analytics/features'
import {device, useStorage} from '#/storage'

const enabledFeatures = new Set<string>([
  Features.IsBskyTeam,
  Features.DebugFeedContext,
  Features.ComposerLanguageDetectionEnable,
  Features.PostThreadKnownLikersEnable,
  Features.FollowSortEnable,
  Features.ModerationInboxEnable,
  Features.AtmosphereScreenEnable,
  Features.NotificationsV2Enable,
  Features.ProfileLinksEnable,
  Features.StarterPacksConfig,
  Features.TrendingDiscoverValues,
  Features.TrendingExploreTopicsCountValue,
])

export function EnableTheFeaturesButton() {
  const [featureGateOverrides, setFeatureGateOverrides] = useStorage(device, [
    'featureGateOverrides',
  ])

  function onPress() {
    const featureKeys = new Set([
      ...Object.values(Features),
      ...Object.keys(getFeatures()),
      ...Object.keys(featureGateOverrides ?? {}),
    ])

    setFeatureGateOverrides(
      Object.fromEntries(
        Array.from(featureKeys, key => [key, enabledFeatures.has(key)]),
      ),
    )
  }

  return (
    <Button
      testID="enableTheFeaturesButton"
      label="apply the feature preset"
      color="primary"
      size="small"
      onPress={onPress}>
      <ButtonText>apply feature preset</ButtonText>
    </Button>
  )
}

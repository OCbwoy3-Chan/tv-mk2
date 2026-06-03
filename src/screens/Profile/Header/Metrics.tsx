import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {
  type CountsMetricsDisplay,
  formatCountsMetricNumber,
  shouldShowCountsMetricLabelOnly,
  shouldShowProfileCountsMetric,
} from '#/lib/metrics-display'
import {makeProfileLink} from '#/lib/routes/links'
import {type Shadow} from '#/state/cache/types'
import {
  useFollowersMetricsDisplay,
  useFollowingMetricsDisplay,
  usePostsMetricsDisplay,
} from '#/state/preferences/metrics-display-preference'
import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function ProfileHeaderMetrics({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}) {
  const {_} = useLingui()
  const followersMetricsDisplay = useFollowersMetricsDisplay()
  const followingMetricsDisplay = useFollowingMetricsDisplay()
  const postsMetricsDisplay = usePostsMetricsDisplay()

  const followersCount = profile.followersCount || 0
  const followingCount = profile.followsCount || 0
  const postsCount = profile.postsCount || 0

  const showFollowers = shouldShowProfileCountsMetric(
    followersMetricsDisplay,
    followersCount,
  )
  const showFollowing = shouldShowProfileCountsMetric(
    followingMetricsDisplay,
    followingCount,
  )
  const showPosts = shouldShowProfileCountsMetric(
    postsMetricsDisplay,
    postsCount,
  )

  if (!showFollowers && !showFollowing && !showPosts) {
    return null
  }

  return (
    <View
      style={[a.flex_row, a.gap_sm, a.align_center]}
      pointerEvents="box-none">
      {showFollowers ? (
        <ProfileCountLink
          testID="profileHeaderFollowersButton"
          to={makeProfileLink(profile, 'followers')}
          label={`${followersCount} ${plural(followersCount, {
            one: 'follower',
            other: 'followers',
          })}`}
          display={followersMetricsDisplay}
          count={followersCount}
          labelText={plural(followersCount, {
            one: 'follower',
            other: 'followers',
          })}
        />
      ) : null}
      {showFollowing ? (
        <ProfileCountLink
          testID="profileHeaderFollowsButton"
          to={makeProfileLink(profile, 'follows')}
          label={_(msg`${followingCount} following`)}
          display={followingMetricsDisplay}
          count={followingCount}
          labelText={plural(followingCount, {
            one: 'following',
            other: 'following',
          })}
        />
      ) : null}
      {showPosts ? (
        <ProfileCountText
          display={postsMetricsDisplay}
          count={postsCount}
          labelText={plural(postsCount, {one: 'post', other: 'posts'})}
        />
      ) : null}
    </View>
  )
}

export function ProfileCountLink({
  testID,
  to,
  label,
  display,
  count,
  labelText,
  onPress,
}: {
  testID: string
  to: string
  label: string
  display: CountsMetricsDisplay
  count: number
  labelText: string
  onPress?: () => void
}) {
  const t = useTheme()

  return (
    <InlineLinkText
      testID={testID}
      style={[a.flex_row, t.atoms.text]}
      to={to}
      label={label}
      onPress={onPress}>
      <ProfileCountText display={display} count={count} labelText={labelText} />
    </InlineLinkText>
  )
}

export function ProfileCountText({
  display,
  count,
  labelText,
}: {
  display: CountsMetricsDisplay
  count: number
  labelText: string
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const labelOnly = shouldShowCountsMetricLabelOnly(display, count)

  if (labelOnly) {
    return (
      <Text style={[a.font_normal, t.atoms.text_contrast_medium, a.text_md]}>
        {labelText}
      </Text>
    )
  }

  return (
    <Text style={[a.font_semi_bold, t.atoms.text, a.text_md]}>
      {formatCountsMetricNumber(i18n, display, count)}{' '}
      <Text style={[t.atoms.text_contrast_medium, a.font_normal, a.text_md]}>
        {labelText}
      </Text>
    </Text>
  )
}

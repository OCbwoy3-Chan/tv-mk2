import {type ComponentProps} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {type CountsMetricsDisplay} from '#/lib/metrics-display'
import {
  useFollowedByMetricsDisplay,
  useFollowersMetricsDisplay,
  useFollowingMetricsDisplay,
  useLikesMetricsDisplay,
  usePostsMetricsDisplay,
  useQuotesMetricsDisplay,
  useReplyMetricsDisplay,
  useRepostsMetricsDisplay,
  useSavesMetricsDisplay,
  useSetFollowedByMetricsDisplay,
  useSetFollowersMetricsDisplay,
  useSetFollowingMetricsDisplay,
  useSetLikesMetricsDisplay,
  useSetPostsMetricsDisplay,
  useSetQuotesMetricsDisplay,
  useSetReplyMetricsDisplay,
  useSetRepostsMetricsDisplay,
  useSetSavesMetricsDisplay,
} from '#/state/preferences/metrics-display-preference'
import {
  useSetShowFollowedByOnOwnProfile,
  useShowFollowedByOnOwnProfile,
} from '#/state/preferences/show-followed-by-on-own-profile'
import {
  useSetShowFollowsYouBadge,
  useShowFollowsYouBadge,
} from '#/state/preferences/show-follows-you-badge'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useBreakpoints} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
import {Text} from '#/components/Typography'
import {RunesScreenLayout} from './components/RunesScreenLayout'

type MetricsDisplayMode = CountsMetricsDisplay

export function RunesImpressionsSettingsScreen() {
  const {t: l} = useLingui()

  const likesMetricsDisplay = useLikesMetricsDisplay()
  const setLikesMetricsDisplay = useSetLikesMetricsDisplay()
  const repostsMetricsDisplay = useRepostsMetricsDisplay()
  const setRepostsMetricsDisplay = useSetRepostsMetricsDisplay()
  const quotesMetricsDisplay = useQuotesMetricsDisplay()
  const setQuotesMetricsDisplay = useSetQuotesMetricsDisplay()
  const savesMetricsDisplay = useSavesMetricsDisplay()
  const setSavesMetricsDisplay = useSetSavesMetricsDisplay()
  const replyMetricsDisplay = useReplyMetricsDisplay()
  const setReplyMetricsDisplay = useSetReplyMetricsDisplay()
  const followersMetricsDisplay = useFollowersMetricsDisplay()
  const setFollowersMetricsDisplay = useSetFollowersMetricsDisplay()
  const followingMetricsDisplay = useFollowingMetricsDisplay()
  const setFollowingMetricsDisplay = useSetFollowingMetricsDisplay()
  const postsMetricsDisplay = usePostsMetricsDisplay()
  const setPostsMetricsDisplay = useSetPostsMetricsDisplay()
  const followedByMetricsDisplay = useFollowedByMetricsDisplay()
  const setFollowedByMetricsDisplay = useSetFollowedByMetricsDisplay()
  const showFollowsYouBadge = useShowFollowsYouBadge()
  const setShowFollowsYouBadge = useSetShowFollowsYouBadge()
  const showFollowedByOnOwnProfile = useShowFollowedByOnOwnProfile()
  const setShowFollowedByOnOwnProfile = useSetShowFollowedByOnOwnProfile()

  const labels = useMetricDisplayLabels()

  return (
    <RunesScreenLayout titleText={l`Impressions`}>
      <ImpressionsSectionHeader icon={ReplyIcon} label={l`Posts`} />
      <MetricRow
        name={l`Likes`}
        value={likesMetricsDisplay}
        labels={labels}
        onChange={setLikesMetricsDisplay}
      />
      <MetricRow
        name={l`Reposts`}
        value={repostsMetricsDisplay}
        labels={labels}
        onChange={setRepostsMetricsDisplay}
      />
      <MetricRow
        name={l`Quotes`}
        value={quotesMetricsDisplay}
        labels={labels}
        onChange={setQuotesMetricsDisplay}
      />
      <MetricRow
        name={l`Saves`}
        value={savesMetricsDisplay}
        labels={labels}
        onChange={setSavesMetricsDisplay}
      />
      <MetricRow
        name={l`Replies`}
        value={replyMetricsDisplay}
        labels={labels}
        onChange={setReplyMetricsDisplay}
      />

      <SettingsList.Divider style={[a.mt_0]} />
      <ImpressionsSectionHeader icon={PersonIcon} label={l`Profiles`} />
      <MetricRow
        name={l`Followers`}
        value={followersMetricsDisplay}
        labels={labels}
        onChange={setFollowersMetricsDisplay}
      />
      <MetricRow
        name={l`Following`}
        value={followingMetricsDisplay}
        labels={labels}
        onChange={setFollowingMetricsDisplay}
      />
      <MetricRow
        name={l`Posts`}
        value={postsMetricsDisplay}
        labels={labels}
        onChange={setPostsMetricsDisplay}
      />
      <MetricRow
        name={l`"Followed by" avatars`}
        value={followedByMetricsDisplay}
        labels={labels}
        onChange={setFollowedByMetricsDisplay}
      />
      <SettingsList.Divider style={[a.mt_0, a.mb_0]} />
      <Toggle.Item
        name="show_followed_by_on_own_profile"
        label={l`Show “Followed by” on own profile`}
        value={showFollowedByOnOwnProfile}
        onChange={setShowFollowedByOnOwnProfile}
        style={[a.w_full, a.px_lg, a.py_md]}>
        <Toggle.Checkbox />
        <Toggle.LabelText style={[a.flex_1]}>
          <Trans>Show “Followed by” on own profile</Trans>
        </Toggle.LabelText>
      </Toggle.Item>
      <Toggle.Item
        name="show_follows_you_badge"
        label={l`Enable extra "Follows you" label`}
        value={showFollowsYouBadge}
        onChange={setShowFollowsYouBadge}
        style={[a.w_full, a.px_lg, a.py_md]}>
        <Toggle.Checkbox />
        <Toggle.LabelText style={[a.flex_1]}>
          <Trans>Enable extra "Follows you" label</Trans>
        </Toggle.LabelText>
      </Toggle.Item>
    </RunesScreenLayout>
  )
}

function ImpressionsSectionHeader({
  icon,
  label,
}: {
  icon: ComponentProps<typeof SettingsList.ItemIcon>['icon']
  label: string
}) {
  return (
    <SettingsList.Item style={[a.py_xs]}>
      <SettingsList.ItemIcon icon={icon} />
      <SettingsList.ItemText>{label}</SettingsList.ItemText>
    </SettingsList.Item>
  )
}

function MetricRow({
  name,
  value,
  labels,
  onChange,
}: {
  name: string
  value: MetricsDisplayMode
  labels: Record<MetricsDisplayMode, string>
  onChange: (value: MetricsDisplayMode) => void
}) {
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()

  const handleChange = (values: string[]) => {
    const next = values[0] as MetricsDisplayMode | undefined
    if (
      next === 'hidden' ||
      next === 'lite' ||
      next === 'visible' ||
      next === 'exact'
    ) {
      onChange(next)
    }
  }

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.gap_sm,
        a.px_lg,
        a.py_lg,
        a.justify_between,
        a.flex_wrap,
      ]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_semi_bold, gtPhone ? a.text_sm : a.text_md]}>
          {name}
        </Text>
      </View>
      <View style={[{minHeight: 35}, a.w_full]}>
        <ToggleButton.Group
          label={l`Configure impression display for: ${name}`}
          values={[value]}
          onChange={handleChange}>
          <ToggleButton.Button name="hidden" label={labels.hidden}>
            <ToggleButton.ButtonText>{labels.hidden}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="lite" label={labels.lite}>
            <ToggleButton.ButtonText>{labels.lite}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="visible" label={labels.visible}>
            <ToggleButton.ButtonText>{labels.visible}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="exact" label={labels.exact}>
            <ToggleButton.ButtonText>{labels.exact}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>
    </View>
  )
}

function useMetricDisplayLabels(): Record<MetricsDisplayMode, string> {
  const {t: l} = useLingui()
  return {
    hidden: l`Hidden`,
    lite: l`Lite`,
    visible: l`Visible`,
    exact: l`Exact`,
  }
}

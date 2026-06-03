import {type ComponentProps, type ReactNode} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  type CountsMetricsDisplay,
  type FollowedByMetricsDisplay,
} from '#/lib/metrics-display'
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
  useSetShowFollowsYouBadge,
  useShowFollowsYouBadge,
} from '#/state/preferences/show-follows-you-badge'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
import {Text} from '#/components/Typography'
import {RunesScreenLayout} from './components/RunesScreenLayout'

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

  const countsLabels = useCountsDisplayLabels()
  const followedByLabels = useFollowedByDisplayLabels()

  return (
    <RunesScreenLayout titleText={l`Impressions`}>
      <ImpressionsSectionHeader icon={ReplyIcon} label={l`Posts`} />
      <CountsMetricRow
        name={l`Likes`}
        value={likesMetricsDisplay}
        labels={countsLabels}
        onChange={setLikesMetricsDisplay}
      />
      <CountsMetricRow
        name={l`Reposts`}
        value={repostsMetricsDisplay}
        labels={countsLabels}
        onChange={setRepostsMetricsDisplay}
      />
      <CountsMetricRow
        name={l`Quotes`}
        value={quotesMetricsDisplay}
        labels={countsLabels}
        onChange={setQuotesMetricsDisplay}
      />
      <CountsMetricRow
        name={l`Saves`}
        value={savesMetricsDisplay}
        labels={countsLabels}
        onChange={setSavesMetricsDisplay}
      />
      <CountsMetricRow
        name={l`Replies`}
        value={replyMetricsDisplay}
        labels={countsLabels}
        onChange={setReplyMetricsDisplay}
      />

      <SettingsList.Divider style={[a.mt_0]} />
      <ImpressionsSectionHeader icon={PersonIcon} label={l`Profiles`} />
      <CountsMetricRow
        name={l`Followers`}
        value={followersMetricsDisplay}
        labels={countsLabels}
        onChange={setFollowersMetricsDisplay}
      />
      <CountsMetricRow
        name={l`Following`}
        value={followingMetricsDisplay}
        labels={countsLabels}
        onChange={setFollowingMetricsDisplay}
      />
      <CountsMetricRow
        name={l`Posts`}
        value={postsMetricsDisplay}
        labels={countsLabels}
        onChange={setPostsMetricsDisplay}
      />
      <FollowedByMetricRow
        name={l`"Followed by" avatars`}
        value={followedByMetricsDisplay}
        labels={followedByLabels}
        onChange={setFollowedByMetricsDisplay}
      />
      <SettingsList.Divider style={[a.mt_0, a.mb_0]} />
      <FollowsYouLabelToggle
        enabled={showFollowsYouBadge}
        onChange={setShowFollowsYouBadge}
      />
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

function FollowsYouLabelToggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <View style={[a.w_full, a.px_lg, a.py_md]}>
      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
        <View
          style={[
            a.w_full,
            a.py_lg,
            a.px_lg,
            a.flex_row,
            a.align_center,
            a.justify_between,
          ]}>
          <Text style={[a.font_semi_bold, t.atoms.text_contrast_high]}>
            <Trans>Enable extra "Follows you" label</Trans>
          </Text>
          <Toggle.Item
            label={l`Toggle to enable or disable the extra Follows you label`}
            name="show_follows_you_badge"
            value={enabled}
            onChange={onChange}>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <Text style={[t.atoms.text_contrast_medium]}>
                {enabled ? <Trans>Enabled</Trans> : <Trans>Disabled</Trans>}
              </Text>
              <Toggle.Switch />
            </View>
          </Toggle.Item>
        </View>
      </View>
    </View>
  )
}

function CountsMetricRow({
  name,
  value,
  labels,
  onChange,
}: {
  name: string
  value: CountsMetricsDisplay
  labels: Record<CountsMetricsDisplay, string>
  onChange: (value: CountsMetricsDisplay) => void
}) {
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()

  const handleChange = (values: string[]) => {
    const next = values[0] as CountsMetricsDisplay | undefined
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
    <MetricRowLayout>
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
    </MetricRowLayout>
  )
}

function FollowedByMetricRow({
  name,
  value,
  labels,
  onChange,
}: {
  name: string
  value: FollowedByMetricsDisplay
  labels: Record<FollowedByMetricsDisplay, string>
  onChange: (value: FollowedByMetricsDisplay) => void
}) {
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()

  const handleChange = (values: string[]) => {
    const next = values[0] as FollowedByMetricsDisplay | undefined
    if (
      next === 'hidden' ||
      next === 'lite' ||
      next === 'visible' ||
      next === 'names'
    ) {
      onChange(next)
    }
  }

  return (
    <MetricRowLayout>
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
          <ToggleButton.Button name="names" label={labels.names}>
            <ToggleButton.ButtonText>{labels.names}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>
    </MetricRowLayout>
  )
}

function MetricRowLayout({children}: {children: ReactNode}) {
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
      {children}
    </View>
  )
}

function useCountsDisplayLabels(): Record<CountsMetricsDisplay, string> {
  const {t: l} = useLingui()
  return {
    hidden: l`Hidden`,
    lite: l`Lite`,
    visible: l`Visible`,
    exact: l`Exact`,
  }
}

function useFollowedByDisplayLabels(): Record<
  FollowedByMetricsDisplay,
  string
> {
  const {t: l} = useLingui()
  return {
    hidden: l`Hidden`,
    lite: l`Lite`,
    visible: l`Visible`,
    names: l`Names`,
  }
}

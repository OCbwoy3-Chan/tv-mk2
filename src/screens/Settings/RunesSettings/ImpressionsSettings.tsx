import {Trans, useLingui} from '@lingui/react/macro'

import {
  useDisableFollowedByMetrics,
  useSetDisableFollowedByMetrics,
} from '#/state/preferences/disable-followed-by-metrics'
import {
  useDisableFollowersMetrics,
  useSetDisableFollowersMetrics,
} from '#/state/preferences/disable-followers-metrics'
import {
  useDisableFollowingMetrics,
  useSetDisableFollowingMetrics,
} from '#/state/preferences/disable-following-metrics'
import {
  useDisableLikesMetrics,
  useSetDisableLikesMetrics,
} from '#/state/preferences/disable-likes-metrics'
import {
  useDisablePostsMetrics,
  useSetDisablePostsMetrics,
} from '#/state/preferences/disable-posts-metrics'
import {
  useDisableQuotesMetrics,
  useSetDisableQuotesMetrics,
} from '#/state/preferences/disable-quotes-metrics'
import {
  useDisableReplyMetrics,
  useSetDisableReplyMetrics,
} from '#/state/preferences/disable-reply-metrics'
import {
  useDisableRepostsMetrics,
  useSetDisableRepostsMetrics,
} from '#/state/preferences/disable-reposts-metrics'
import {
  useDisableSavesMetrics,
  useSetDisableSavesMetrics,
} from '#/state/preferences/disable-saves-metrics'
import {
  useSetShowFollowsYouBadge,
  useShowFollowsYouBadge,
} from '#/state/preferences/show-follows-you-badge'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Eye_Stroke2_Corner0_Rounded as VisibilityIcon} from '#/components/icons/Eye'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesImpressionsSettingsScreen() {
  const {t: l} = useLingui()

  const disableLikesMetrics = useDisableLikesMetrics()
  const setDisableLikesMetrics = useSetDisableLikesMetrics()
  const disableRepostsMetrics = useDisableRepostsMetrics()
  const setDisableRepostsMetrics = useSetDisableRepostsMetrics()
  const disableQuotesMetrics = useDisableQuotesMetrics()
  const setDisableQuotesMetrics = useSetDisableQuotesMetrics()
  const disableSavesMetrics = useDisableSavesMetrics()
  const setDisableSavesMetrics = useSetDisableSavesMetrics()
  const disableReplyMetrics = useDisableReplyMetrics()
  const setDisableReplyMetrics = useSetDisableReplyMetrics()
  const disableFollowersMetrics = useDisableFollowersMetrics()
  const setDisableFollowersMetrics = useSetDisableFollowersMetrics()
  const disableFollowingMetrics = useDisableFollowingMetrics()
  const setDisableFollowingMetrics = useSetDisableFollowingMetrics()
  const disableFollowedByMetrics = useDisableFollowedByMetrics()
  const setDisableFollowedByMetrics = useSetDisableFollowedByMetrics()
  const disablePostsMetrics = useDisablePostsMetrics()
  const setDisablePostsMetrics = useSetDisablePostsMetrics()
  const showFollowsYouBadge = useShowFollowsYouBadge()
  const setShowFollowsYouBadge = useSetShowFollowsYouBadge()

  return (
    <RunesScreenLayout titleText={l`Impressions`}>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={VisibilityIcon} />
        <SettingsList.ItemText>
          <Trans>Posts</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="disable_likes_metrics"
          label={l`Remove likes counts`}
          value={disableLikesMetrics}
          onChange={value => setDisableLikesMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove likes counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_reposts_metrics"
          label={l`Remove reposts counts`}
          value={disableRepostsMetrics}
          onChange={value => setDisableRepostsMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove reposts counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_quotes_metrics"
          label={l`Remove quotes counts`}
          value={disableQuotesMetrics}
          onChange={value => setDisableQuotesMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove quotes counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_saves_metrics"
          label={l`Remove saves counts`}
          value={disableSavesMetrics}
          onChange={value => setDisableSavesMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove saves counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_reply_metrics"
          label={l`Remove reply counts`}
          value={disableReplyMetrics}
          onChange={value => setDisableReplyMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove reply counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
      </SettingsList.Group>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={VisibilityIcon} />
        <SettingsList.ItemText>
          <Trans>Profiles</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="disable_followers_metrics"
          label={l`Remove followers counts`}
          value={disableFollowersMetrics}
          onChange={value => setDisableFollowersMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove followers counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_following_metrics"
          label={l`Remove following counts`}
          value={disableFollowingMetrics}
          onChange={value => setDisableFollowingMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove following counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_followed_by_metrics"
          label={l`Remove "followed by" counts`}
          value={disableFollowedByMetrics}
          onChange={value => setDisableFollowedByMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove "followed by" avatars</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="show_follows_you_badge"
          label={l`Show "Follows you" badge`}
          value={showFollowsYouBadge}
          onChange={value => setShowFollowsYouBadge(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Show "Follows you" badge</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_posts_metrics"
          label={l`Remove post counts`}
          value={disablePostsMetrics}
          onChange={value => setDisablePostsMetrics(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Remove post counts</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
      </SettingsList.Group>
    </RunesScreenLayout>
  )
}

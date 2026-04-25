import {Trans, useLingui} from '@lingui/react/macro'

import {useGoLinksEnabled, useSetGoLinksEnabled} from '#/state/preferences'
import {
  useDisableComposerPrompt,
  useSetDisableComposerPrompt,
} from '#/state/preferences/disable-composer-prompt'
import {
  useDisableTopOfFeedButton,
  useSetDisableTopOfFeedButton,
} from '#/state/preferences/disable-top-of-feed-button'
import {
  useDisableVerifyEmailReminder,
  useSetDisableVerifyEmailReminder,
} from '#/state/preferences/disable-verify-email-reminder'
import {
  useHideFeedsPromoTab,
  useSetHideFeedsPromoTab,
} from '#/state/preferences/hide-feeds-promo-tab'
import {
  useHideSimilarAccountsRecomm,
  useSetHideSimilarAccountsRecomm,
} from '#/state/preferences/hide-similar-accounts-recommendations'
import {
  useHideUnreplyablePosts,
  useSetHideUnreplyablePosts,
} from '#/state/preferences/hide-unreplyable-posts'
import {
  useNoDiscoverFallback,
  useSetNoDiscoverFallback,
} from '#/state/preferences/no-discover-fallback'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesUsabilitySettingsScreen() {
  const {t: l} = useLingui()

  const goLinksEnabled = useGoLinksEnabled()
  const setGoLinksEnabled = useSetGoLinksEnabled()

  const noDiscoverFallback = useNoDiscoverFallback()
  const setNoDiscoverFallback = useSetNoDiscoverFallback()

  const hideFeedsPromoTab = useHideFeedsPromoTab()
  const setHideFeedsPromoTab = useSetHideFeedsPromoTab()

  const hideSimilarAccountsRecomm = useHideSimilarAccountsRecomm()
  const setHideSimilarAccountsRecomm = useSetHideSimilarAccountsRecomm()

  const hideUnreplyablePosts = useHideUnreplyablePosts()
  const setHideUnreplyablePosts = useSetHideUnreplyablePosts()

  const disableComposerPrompt = useDisableComposerPrompt()
  const setDisableComposerPrompt = useSetDisableComposerPrompt()

  const disableTopOfFeedButton = useDisableTopOfFeedButton()
  const setDisableTopOfFeedButton = useSetDisableTopOfFeedButton()

  const disableVerifyEmailReminder = useDisableVerifyEmailReminder()
  const setDisableVerifyEmailReminder = useSetDisableVerifyEmailReminder()

  return (
    <RunesScreenLayout titleText={l`Usability`}>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>
          <Trans>Debloating</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="use_go_links"
          label={l`Redirect through go.bsky.app`}
          value={goLinksEnabled ?? false}
          onChange={value => setGoLinksEnabled(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Redirect through go.bsky.app</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="no_discover_fallback"
          label={l`Do not fall back to discover feed`}
          value={noDiscoverFallback}
          onChange={value => setNoDiscoverFallback(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Do not fall back to discover feed</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="hide_feeds_promo_tab"
          label={l`Hide "Feeds ✨" tab when only one feed is selected`}
          value={hideFeedsPromoTab}
          onChange={value => setHideFeedsPromoTab(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Hide "Feeds ✨" tab when only one feed is selected</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="hide_similar_accounts_recommendations"
          label={l`Hide similar accounts recommendations`}
          value={hideSimilarAccountsRecomm}
          onChange={value => setHideSimilarAccountsRecomm(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Hide similar accounts recommendations</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="hide_unreplyable_posts"
          label={l`Hide posts that cannot be replied to from feeds`}
          value={hideUnreplyablePosts}
          onChange={value => setHideUnreplyablePosts(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Hide posts that cannot be replied to from feeds</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Hides posts from feeds where replies are disabled (e.g. due to
            postgates or other restrictions). Does not affect thread views.
          </Trans>
        </Admonition>
        <Toggle.Item
          name="disable_composer_prompt"
          label={l`Disable composer prompt`}
          value={disableComposerPrompt}
          onChange={value => setDisableComposerPrompt(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Disable composer prompt</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_top_of_feed_button"
          label={l`Disable top-of-feed button`}
          value={disableTopOfFeedButton ?? false}
          onChange={value => setDisableTopOfFeedButton(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Disable top-of-feed button</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="disable_verify_email_reminder"
          label={l`Disable verify email reminder`}
          value={disableVerifyEmailReminder}
          onChange={value => setDisableVerifyEmailReminder(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Disable verify email reminder</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Admonition type="warning" style={[a.flex_1]}>
          <Trans>
            This only gets rid of the reminder on app launch, useful if your PDS
            does not have email verification setup.&nbsp; This does NOT give
            access to features locked behind email verification.
          </Trans>
        </Admonition>
      </SettingsList.Group>
    </RunesScreenLayout>
  )
}

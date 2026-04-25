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
  useHideScaryFollowButtons,
  useSetHideScaryFollowButtons,
} from '#/state/preferences/hide-scary-follow-buttons'
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
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {ArrowTopCircle_Stroke2_Corner0_Rounded as ArrowTopIcon} from '#/components/icons/ArrowTopCircle'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Eye_Stroke2_Corner2_Rounded as EyeIcon} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {PencilLine_Stroke2_Corner2_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
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

  const hideScaryFollowButtons = useHideScaryFollowButtons()
  const setHideScaryFollowButtons = useSetHideScaryFollowButtons()

  const disableComposerPrompt = useDisableComposerPrompt()
  const setDisableComposerPrompt = useSetDisableComposerPrompt()

  const disableTopOfFeedButton = useDisableTopOfFeedButton()
  const setDisableTopOfFeedButton = useSetDisableTopOfFeedButton()

  const disableVerifyEmailReminder = useDisableVerifyEmailReminder()
  const setDisableVerifyEmailReminder = useSetDisableVerifyEmailReminder()

  return (
    <RunesScreenLayout titleText={l`Usability`}>
      <Toggle.Item
        name="use_go_links"
        label={l`Redirect through go.bsky.app`}
        value={goLinksEnabled ?? false}
        onChange={value => setGoLinksEnabled(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ArrowShareRightIcon} />
          <SettingsList.ItemText>
            <Trans>Redirect through go.bsky.app</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="no_discover_fallback"
        label={l`Do not fall back to discover feed`}
        value={noDiscoverFallback}
        onChange={value => setNoDiscoverFallback(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={EyeSlashIcon} />
          <SettingsList.ItemText>
            <Trans>Do not fall back to discover feed</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="hide_feeds_promo_tab"
        label={l`Hide "Feeds ✨" tab when only one feed is selected`}
        value={hideFeedsPromoTab}
        onChange={value => setHideFeedsPromoTab(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={EyeIcon} />
          <SettingsList.ItemText>
            <Trans>Hide "Feeds ✨" tab when only one feed is selected</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="disable_similar_accounts_recommendations"
        label={l`Disable similar accounts recommendations`}
        value={hideSimilarAccountsRecomm}
        onChange={value => setHideSimilarAccountsRecomm(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={PersonGroupIcon} />
          <SettingsList.ItemText>
            <Trans>Disable similar accounts recommendations</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="disable_composer_prompt"
        label={l`Disable composer prompt`}
        value={disableComposerPrompt}
        onChange={value => setDisableComposerPrompt(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={PencilIcon} />
          <SettingsList.ItemText>
            <Trans>Disable composer prompt</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="disable_top_of_feed_button"
        label={l`Disable top-of-feed button`}
        value={disableTopOfFeedButton ?? false}
        onChange={value => setDisableTopOfFeedButton(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ArrowTopIcon} />
          <SettingsList.ItemText>
            <Trans>Disable top-of-feed button</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="hide_scary_follow_buttons"
        label={l`Hide follow button on posts and scrolled profile header`}
        value={hideScaryFollowButtons}
        onChange={value => setHideScaryFollowButtons(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={PlusIcon} />
          <SettingsList.ItemText>
            <Trans>
              Hide follow button on posts and scrolled profile header
            </Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="hide_unreplyable_posts"
        label={l`Hide posts that cannot be replied to from feeds`}
        value={hideUnreplyablePosts}
        onChange={value => setHideUnreplyablePosts(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ReplyIcon} />
          <SettingsList.ItemText>
            <Trans>Hide posts that cannot be replied to from feeds</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Hides posts from feeds where replies are disabled (e.g. due to
            postgates or other restrictions). Does not affect thread views.
          </Trans>
        </Admonition>
      </SettingsList.Item>
      <Toggle.Item
        name="disable_verify_email_reminder"
        label={l`Disable verify email reminder`}
        value={disableVerifyEmailReminder}
        onChange={value => setDisableVerifyEmailReminder(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={EnvelopeIcon} />
          <SettingsList.ItemText>
            <Trans>Disable verify email reminder</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="warning" style={[a.flex_1]}>
          <Trans>
            This only gets rid of the reminder on app launch, useful if your PDS
            does not have email verification setup.&nbsp;This does NOT give
            access to features locked behind email verification.
          </Trans>
        </Admonition>
      </SettingsList.Item>
    </RunesScreenLayout>
  )
}

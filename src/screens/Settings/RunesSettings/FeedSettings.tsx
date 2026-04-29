import {Trans, useLingui} from '@lingui/react/macro'

import {
  useDisableComposerPrompt,
  useSetDisableComposerPrompt,
} from '#/state/preferences/disable-composer-prompt'
import {
  useDisableTopOfFeedButton,
  useSetDisableTopOfFeedButton,
} from '#/state/preferences/disable-top-of-feed-button'
import {
  useHideFeedsPromoTab,
  useSetHideFeedsPromoTab,
} from '#/state/preferences/hide-feeds-promo-tab'
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
import {ArrowTopCircle_Stroke2_Corner0_Rounded as ArrowTopIcon} from '#/components/icons/ArrowTopCircle'
import {Eye_Stroke2_Corner2_Rounded as EyeIcon} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {PencilLine_Stroke2_Corner2_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesUsabilityFeedSettingsScreen() {
  const {t: l} = useLingui()

  const noDiscoverFallback = useNoDiscoverFallback()
  const setNoDiscoverFallback = useSetNoDiscoverFallback()

  const hideFeedsPromoTab = useHideFeedsPromoTab()
  const setHideFeedsPromoTab = useSetHideFeedsPromoTab()

  const disableComposerPrompt = useDisableComposerPrompt()
  const setDisableComposerPrompt = useSetDisableComposerPrompt()

  const disableTopOfFeedButton = useDisableTopOfFeedButton()
  const setDisableTopOfFeedButton = useSetDisableTopOfFeedButton()

  const hideUnreplyablePosts = useHideUnreplyablePosts()
  const setHideUnreplyablePosts = useSetHideUnreplyablePosts()

  return (
    <RunesScreenLayout titleText={l`Feeds`}>
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
    </RunesScreenLayout>
  )
}

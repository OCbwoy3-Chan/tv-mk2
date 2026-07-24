import {Trans, useLingui} from '@lingui/react/macro'

import {useSetShowGermDmButton, useShowGermDmButton} from '#/state/preferences'
import {
  useHideSimilarAccountsRecomm,
  useSetHideSimilarAccountsRecomm,
} from '#/state/preferences/hide-similar-accounts-recommendations'
import {RestartRequiredPrompt} from '#/state/preferences/restart-required-prompt'
import {
  useSetShowLinkInHandle,
  useShowLinkInHandle,
} from '#/state/preferences/show-link-in-handle'
import {
  useSetShowLinkInHandleOnlyOnWorkingLinks,
  useShowLinkInHandleOnlyOnWorkingLinks,
} from '#/state/preferences/show-link-in-handle-only-on-working-links'
import {
  useSetShowStandardLabelerProfile,
  useShowStandardLabelerProfile,
} from '#/state/preferences/show-standard-labeler-profile'
import {
  useHandleInLinks,
  useSetHandleInLinks,
} from '#/state/preferences/use-handle-in-links'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {At_Stroke2_Corner2_Rounded as AtIcon} from '#/components/icons/At'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {Shield_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesUsabilityProfileSettingsScreen() {
  const {t: l} = useLingui()
  const restartPromptControl = Dialog.useDialogControl()

  const handleInLinks = useHandleInLinks()
  const setHandleInLinks = useSetHandleInLinks()
  const showLinkInHandle = useShowLinkInHandle()
  const setShowLinkInHandle = useSetShowLinkInHandle()
  const showLinkInHandleOnlyOnWorkingLinks =
    useShowLinkInHandleOnlyOnWorkingLinks()
  const setShowLinkInHandleOnlyOnWorkingLinks =
    useSetShowLinkInHandleOnlyOnWorkingLinks()
  const showGermDmButton = useShowGermDmButton()
  const setShowGermDmButton = useSetShowGermDmButton()
  const showStandardLabelerProfile = useShowStandardLabelerProfile()
  const setShowStandardLabelerProfile = useSetShowStandardLabelerProfile()
  const hideSimilarAccountsRecomm = useHideSimilarAccountsRecomm()
  const setHideSimilarAccountsRecomm = useSetHideSimilarAccountsRecomm()

  return (
    <RunesScreenLayout titleText={l`Profiles`}>
      <Toggle.Item
        name="use_handle_in_links"
        label={l`Use handles in profile links instead of DIDs (requires restart)`}
        value={handleInLinks ?? false}
        onChange={value => {
          setHandleInLinks(value)
          restartPromptControl.open()
        }}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={AtIcon} />
          <SettingsList.ItemText>
            <Trans>Use handles in profile links instead of DIDs</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="show_link_in_handle"
        label={l`On non-bsky.social handles, show a link to that URL`}
        value={showLinkInHandle}
        onChange={value => setShowLinkInHandle(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ChainLinkIcon} />
          <SettingsList.ItemText>
            <Trans>On non-bsky.social handles, show a link to that URL</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      {showLinkInHandle && (
        <Toggle.Item
          name="show_link_in_handle_only_on_working_links"
          label={l`Only show URL on handles with working links`}
          value={showLinkInHandleOnlyOnWorkingLinks}
          onChange={value => setShowLinkInHandleOnlyOnWorkingLinks(value)}>
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={ChainLinkIcon} />
            <SettingsList.ItemText>
              <Trans>Only show URL on handles with working links</Trans>
            </SettingsList.ItemText>
            <Toggle.Platform />
          </SettingsList.Item>
        </Toggle.Item>
      )}
      <Toggle.Item
        name="show_germ_dm_button"
        label={l`Show Germ DM button on profiles`}
        value={showGermDmButton}
        onChange={value => setShowGermDmButton(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={MessageIcon} />
          <SettingsList.ItemText>
            <Trans>Show Germ DM button on profiles</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="show_standard_labeler_profile"
        label={l`Show standard profile UI on labeler accounts`}
        value={showStandardLabelerProfile}
        onChange={value => setShowStandardLabelerProfile(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ShieldIcon} />
          <SettingsList.ItemText>
            <Trans>Show standard profile UI on labeler accounts</Trans>
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

      <RestartRequiredPrompt control={restartPromptControl} />
    </RunesScreenLayout>
  )
}

import {Trans, useLingui} from '@lingui/react/macro'

import {
  useSetShowExternalShareButtons,
  useShowExternalShareButtons,
} from '#/state/preferences/external-share-buttons'
import {
  useSetShowLinkInHandle,
  useShowLinkInHandle,
} from '#/state/preferences/show-link-in-handle.tsx'
import {
  useSetShowLinkInHandleOnlyOnWorkingLinks,
  useShowLinkInHandleOnlyOnWorkingLinks,
} from '#/state/preferences/show-link-in-handle-only-on-working-links'
import {
  useHandleInLinks,
  useSetHandleInLinks,
} from '#/state/preferences/use-handle-in-links'
import {RestartRequiredPrompt} from '#/state/preferences/restart-required-prompt'
import * as Dialog from '#/components/Dialog'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {At_Stroke2_Corner2_Rounded as AtIcon} from '#/components/icons/At'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesMenusSettingsScreen() {
  const {t: l} = useLingui()

  const handleInLinks = useHandleInLinks()
  const setHandleInLinks = useSetHandleInLinks()
  const restartPromptControl = Dialog.useDialogControl()

  const showExternalShareButtons = useShowExternalShareButtons()
  const setShowExternalShareButtons = useSetShowExternalShareButtons()

  const showLinkInHandle = useShowLinkInHandle()
  const setShowLinkInHandle = useSetShowLinkInHandle()
  const showLinkInHandleOnlyOnWorkingLinks =
    useShowLinkInHandleOnlyOnWorkingLinks()
  const setShowLinkInHandleOnlyOnWorkingLinks =
    useSetShowLinkInHandleOnlyOnWorkingLinks()

  return (
    <RunesScreenLayout titleText={l`Menus`}>
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
        name="external_share_buttons"
        label={l`Show "Open original post" and "Open post in PDSls" buttons`}
        value={showExternalShareButtons}
        onChange={value => setShowExternalShareButtons(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ArrowShareRightIcon} />
          <SettingsList.ItemText>
            <Trans>
              Show "Open original post" and "Open post in PDSls" buttons
            </Trans>
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

      <RestartRequiredPrompt
        control={restartPromptControl}
      />
    </RunesScreenLayout>
  )
}

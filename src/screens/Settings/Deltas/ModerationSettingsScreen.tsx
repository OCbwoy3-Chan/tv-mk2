import {Trans, useLingui} from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {RunesScreenLayout} from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {useDeltasPreferences, useSetDeltasPreference} from '#/deltas/preferences'
import { Shield_Stroke2_Corner0_Rounded as ShieldIcon } from '#/components/icons/Shield'

export function DeltasModerationSettingsScreen() {
  const {t: l} = useLingui()
  const preferences = useDeltasPreferences()
  const setPreference = useSetDeltasPreference()

  return (
    <RunesScreenLayout titleText={l`Moderation`}>
      <Toggle.Item
        testID="showBlockedMessagesToggle"
        name="show_blocked_messages"
        label={l`Show blocked messages`}
        value={preferences.showBlockedMessages}
        onChange={value => setPreference('showBlockedMessages', value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={MessageIcon} />
          <SettingsList.ItemText>
            <Trans>Show blocked messages</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Show group chat messages from users blocking you.
          </Trans>
        </Admonition>
      </SettingsList.Item>
      <Toggle.Item
        testID="showHiddenListToggle"
        name="show_hidden_list"
        label={l`Show hidden lists`}
        value={preferences.showHiddenList}
        onChange={value => setPreference('showHiddenList', value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ListIcon} />
          <SettingsList.ItemText>
            <Trans>Show hidden lists</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Show lists hidden by Bluesky Moderation or subscribed labelers.
          </Trans>
        </Admonition>
      </SettingsList.Item>
      <Toggle.Item
        testID="showHiddenListToggle"
        name="show_mdni_badge"
        label={l`Show MDNI badges`}
        value={preferences.showHiddenList}
        onChange={value => setPreference('showMdniBadge', value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ShieldIcon} />
          <SettingsList.ItemText>
            <Trans>Show MDNI badge</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Adds a badge to self-identified MDNI (Minors Do Not Interact) accounts without an 🔞 emoji in their name.
            Has false positives & negatives.
          </Trans>
        </Admonition>
      </SettingsList.Item>
    </RunesScreenLayout>
  )
}

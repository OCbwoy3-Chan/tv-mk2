// Adapted from eurosky-social/eurosky-social-app (MIT), eurosky/fork.
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Key_Stroke2_Corner2_Rounded as KeyIcon} from '#/components/icons/Key'
import {emitOpenKeyboardShortcuts} from './events'
import {useKeyboardShortcutsPreference} from './preferences'

export function KeyboardShortcutsSettings() {
  const {t: l} = useLingui()
  const {enabled, setEnabled} = useKeyboardShortcutsPreference()

  return (
    <>
      <SettingsList.Divider />
      <SettingsList.Item style={[a.align_start]}>
        <SettingsList.ItemIcon icon={KeyIcon} />
        <View style={[a.flex_1, a.gap_sm]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <SettingsList.ItemText>
              <Trans>Keyboard shortcuts</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="keyboard_shortcuts"
              label={l`Keyboard shortcuts`}
              value={enabled}
              onChange={setEnabled}>
              <Toggle.Platform />
            </Toggle.Item>
          </View>
          <Button
            label={l`View keyboard shortcuts`}
            size="small"
            color="secondary"
            onPress={emitOpenKeyboardShortcuts}
            style={[a.self_start]}>
            <ButtonText>
              <Trans>View shortcuts</Trans>
            </ButtonText>
          </Button>
        </View>
      </SettingsList.Item>
    </>
  )
}

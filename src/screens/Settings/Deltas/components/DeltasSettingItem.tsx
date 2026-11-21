import {View} from 'react-native'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {TextSetting} from '#/screens/Settings/Deltas/components/TextSetting'
import {ToggleSetting} from '#/screens/Settings/Deltas/components/ToggleSetting'
import {type DeltasSetting} from '#/screens/Settings/Deltas/components/types'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'

export function DeltasSettingItem({
  setting,
}: {
  setting: DeltasSetting
}) {
  if (setting.visible === false) return null
  return (
    <View>
      {setting.type === 'toggle' && <ToggleSetting setting={setting} />}
      {(setting.type === 'text' || setting.error || setting.info) && (
        <SettingsList.Item>
          <View style={[a.flex_1, a.gap_sm]}>
            {setting.type === 'text' && <TextSetting setting={setting} />}
            {(setting.error || setting.info) && (
              <Admonition type={setting.error ? 'warning' : 'info'}>
                {setting.error || setting.info}
              </Admonition>
            )}
          </View>
        </SettingsList.Item>
      )}
    </View>
  )
}

import {View} from 'react-native'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {TextSetting} from '#/screens/Settings/Deltas/DeltasPlus/components/TextSetting'
import {ToggleSetting} from '#/screens/Settings/Deltas/DeltasPlus/components/ToggleSetting'
import {type DeltasPlusSetting} from '#/screens/Settings/Deltas/DeltasPlus/components/types'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'

export function DeltasPlusSettingItem({
  setting,
}: {
  setting: DeltasPlusSetting
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

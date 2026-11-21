import {type DeltasSetting} from '#/screens/Settings/Deltas/components/types'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import {
  useDeltasPreferences,
  useSetDeltasPreference,
} from '#/deltas/preferences'

export function ToggleSetting({
  setting,
}: {
  setting: Extract<DeltasSetting, {type: 'toggle'}>
}) {
  const preferences = useDeltasPreferences()
  const setPreference = useSetDeltasPreference()
  return (
    <Toggle.Item
      name={setting.value}
      label={setting.label}
      testID={setting.value}
      value={preferences[setting.value]}
      onChange={value => setPreference(setting.value, value)}>
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={setting.icon} />
        <SettingsList.ItemText>{setting.label}</SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}

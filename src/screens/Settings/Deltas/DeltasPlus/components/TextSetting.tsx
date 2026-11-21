import {type DeltasPlusSetting} from '#/screens/Settings/Deltas/DeltasPlus/components/types'
import * as TextField from '#/components/forms/TextField'
import {
  useDeltasPreferences,
  useSetDeltasPreference,
} from '#/deltas/preferences'

export function TextSetting({
  setting,
}: {
  setting: Extract<DeltasPlusSetting, {type: 'text'}>
}) {
  const preferences = useDeltasPreferences()
  const setPreference = useSetDeltasPreference()
  return (
    <View>
      <TextField.LabelText>{setting.label}</TextField.LabelText>
      <TextField.Root isInvalid={!!setting.error}>
        <TextField.Input
          label={setting.label}
          placeholder={setting.placeholder}
          testID={setting.value}
          value={preferences[setting.value]}
          onChangeText={value =>
            setPreference(setting.value, setting.trim ? value.trim() : value)
          }
          autoCapitalize="none"
          autoCorrect={false}
        />
      </TextField.Root>
    </View>
  )
}
import {View} from 'react-native'


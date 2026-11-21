import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {useDeltasPreferences} from '#/deltas/preferences'

type Preferences = ReturnType<typeof useDeltasPreferences>
type BooleanPreferenceKey = {
  [K in keyof Preferences]: Preferences[K] extends boolean ? K : never
}[keyof Preferences]
type StringPreferenceKey = {
  [K in keyof Preferences]: string extends Preferences[K] ? K : never
}[keyof Preferences]

export type DeltasPlusSetting = {
  label: string
  visible?: boolean
  info?: string
  error?: string
} & (
  | {
      type: 'toggle'
      value: BooleanPreferenceKey
      icon: React.ComponentProps<typeof SettingsList.ItemIcon>['icon']
    }
  | {
      type: 'text'
      value: StringPreferenceKey
      placeholder?: string
      trim?: boolean
    }
)


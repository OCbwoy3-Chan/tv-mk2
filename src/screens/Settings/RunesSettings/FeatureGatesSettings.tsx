import {Trans, useLingui} from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {Features, features} from '#/analytics/features'
import {device, useStorage} from '#/storage'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesExtraFeatureGatesSettingsScreen() {
  const {t: l} = useLingui()
  const [featureGateOverrides, setFeatureGateOverrides] = useStorage(device, [
    'featureGateOverrides',
  ])

  const featureGates = Object.values(Features)

  return (
    <RunesScreenLayout titleText={l`Feature gates`}>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            These switches force local overrides for GrowthBook feature gates on
            this device.
          </Trans>
        </Admonition>
      </SettingsList.Item>
      {featureGates.map(gate => {
        const hasOverride = Object.prototype.hasOwnProperty.call(
          featureGateOverrides ?? {},
          gate,
        )
        const value = hasOverride
          ? (featureGateOverrides?.[gate] ?? false)
          : features.isOn(gate)

        return (
          <Toggle.Item
            key={gate}
            name={gate}
            label={gate}
            value={value}
            onChange={next =>
              setFeatureGateOverrides({
                ...(featureGateOverrides ?? {}),
                [gate]: next,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemText>{gate}</SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
        )
      })}
      <SettingsList.PressableItem
        label={l`Reset all feature gate overrides`}
        onPress={() => setFeatureGateOverrides({})}>
        <SettingsList.ItemText>
          Reset all feature gate overrides
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
    </RunesScreenLayout>
  )
}

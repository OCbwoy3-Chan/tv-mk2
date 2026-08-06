import { Trans, useLingui } from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import { Features, features } from '#/analytics/features'
import { device, useStorage } from '#/storage'
import { atoms as a, useTheme } from '#/alf'

export function DeltasJapanLogoToggle() {
    const t = useTheme();

    const [featureGateOverrides, setFeatureGateOverrides] = useStorage(device, [
        'featureGateOverrides',
    ])

    const hasOverride = Object.prototype.hasOwnProperty.call(
        featureGateOverrides ?? {},
        Features.CustomLogoJapanEnable,
    )
    const value = hasOverride
        ? (featureGateOverrides?.[Features.CustomLogoJapanEnable] ?? false)
        : features.isOn(Features.CustomLogoJapanEnable)

    return (
        <Toggle.Item
            key={Features.CustomLogoJapanEnable}
            name={Features.CustomLogoJapanEnable}
            label={Features.CustomLogoJapanEnable}
            value={value}
            onChange={next =>
                setFeatureGateOverrides({
                    ...(featureGateOverrides ?? {}),
                    [Features.CustomLogoJapanEnable]: next,
                })
            }
            style={[
                a.w_full,
                a.rounded_md,
                a.overflow_hidden,
                t.atoms.bg_contrast_25
            ]}
        >
            <SettingsList.Item>
                <SettingsList.ItemText>
                    <Trans>Enable Japan Logo</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
            </SettingsList.Item>
        </Toggle.Item>
    )
}

import { Trans } from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import { atoms as a, useTheme } from '#/alf'
import { useHideBetaBadge, useSetHideBetaBadge } from '#/state/preferences/hide-beta-badge'

export function DeltasBetaBadgeToggle() {
    const t = useTheme();

    const hideBetaBadge = useHideBetaBadge();
    const setHideBetaBadge = useSetHideBetaBadge();

    return (
        <Toggle.Item
            key={"hide_beta_badge"}
            name={"Hide beta badge"}
            label={"Hide beta badge"}
            value={hideBetaBadge}
            onChange={next =>
                setHideBetaBadge(next)
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
                    <Trans>Hide beta badge</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
            </SettingsList.Item>
        </Toggle.Item>
    )
}

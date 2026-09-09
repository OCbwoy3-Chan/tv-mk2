import { Trans } from '@lingui/react/macro'

import { usePrivatePostsEnabled, useSetPrivatePostsEnabled } from '#/state/preferences/private-posts-enabled'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { atoms as a, useTheme } from '#/alf'
import * as Toggle from '#/components/forms/Toggle'

export function DeltasPrivatePostsToggle() {
    const t = useTheme();

    const privatePostsEnabled = usePrivatePostsEnabled();
    const setPrivatePostsEnabled = useSetPrivatePostsEnabled();

    return (
        <Toggle.Item
            key={"enable_private_posts"}
            name={"Enable private posts"}
            label={"Enable private posts"}
            value={privatePostsEnabled}
            onChange={next =>
                setPrivatePostsEnabled(next)
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
                    <Trans>Enable private posts</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
            </SettingsList.Item>
        </Toggle.Item>
    )
}

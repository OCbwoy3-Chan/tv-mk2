import {Trans, useLingui} from '@lingui/react/macro'

import {
  useAutoCompactAccountSwitcher,
  useSetAutoCompactAccountSwitcher,
} from '#/state/preferences/auto-compact-account-switcher'
import {
  useCompactAccountSwitcher,
  useSetCompactAccountSwitcher,
} from '#/state/preferences/compact-account-switcher'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesDisplayDensitySettingsScreen() {
  const {t: l} = useLingui()

  const compactAccountSwitcher = useCompactAccountSwitcher()
  const setCompactAccountSwitcher = useSetCompactAccountSwitcher()

  const autoCompactAccountSwitcher = useAutoCompactAccountSwitcher()
  const setAutoCompactAccountSwitcher = useSetAutoCompactAccountSwitcher()

  return (
    <RunesScreenLayout titleText={l`Density`}>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={PersonGroupIcon} />
        <SettingsList.ItemText>
          <Trans>Account switcher</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="compact_account_switcher"
          label={l`Use compact account switcher`}
          value={compactAccountSwitcher}
          onChange={value => setCompactAccountSwitcher(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Use compact account switcher</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Toggle.Item
          name="auto_compact_account_switcher"
          label={l`Automatically use compact account switcher with more than 6 accounts`}
          value={autoCompactAccountSwitcher}
          onChange={value => setAutoCompactAccountSwitcher(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>
              Automatically use compact account switcher with more than 6
              accounts
            </Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
      </SettingsList.Group>
    </RunesScreenLayout>
  )
}

import {Trans, useLingui} from '@lingui/react/macro'

import {useSetTokimekiPolls, useTokimekiPolls} from '#/state/preferences'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'

export function DeltasTokimekiPollsToggle() {
  const {t: l} = useLingui()
  const enabled = useTokimekiPolls()
  const setEnabled = useSetTokimekiPolls()

  return (
    <Toggle.Item
      testID="tokimekiPollsToggle"
      name="tokimeki_polls"
      label={l`Use TOKIMEKI polls`}
      value={enabled}
      onChange={setEnabled}>
      <SettingsList.Item>
        <SettingsList.ItemText>
          <Trans>Use TOKIMEKI polls</Trans>
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}

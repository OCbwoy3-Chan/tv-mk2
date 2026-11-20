import { Trans, useLingui } from '@lingui/react/macro'

import { useOpenComposer } from '#/lib/hooks/useOpenComposer'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { RunesScreenLayout } from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import * as Toggle from '#/components/forms/Toggle'
import { useDeltasPreferences, useSetDeltasPreference } from '#/deltas/preferences'
import { Admonition } from '#/components/Admonition'
import { atoms as a, useTheme } from '#/alf'
import { useSession } from '#/state/session'
import { useVipStatusQuery } from '#/deltas/lib/vipEntitlement'
import { Fediverse } from '#/components/icons/Fediverse'
import { View } from 'react-native'
import { Text } from "#/components/Typography"
import { Button, ButtonText } from '#/components/Button'

export function DeltasPlusSettingsScreen() {
  const { t: l } = useLingui()
  const preferences = useDeltasPreferences()
  const setPreference = useSetDeltasPreference()
  const user = useSession()
  const { data: hasVip } = useVipStatusQuery(user.currentAccount?.did)
  const { openComposer } = useOpenComposer()

  if (hasVip !== true && hasVip !== false) {
    <RunesScreenLayout titleText={l`Deltas+`}>{null}</RunesScreenLayout>
  }

  if (hasVip === false) {
    return (
      <RunesScreenLayout titleText={l`Deltas+`}>
        <SettingsList.Item>
          <Admonition type="info" style={[a.flex_1]}>
            <Trans>Deltas+ requires a VIP etitlement.</Trans>
          </Admonition>
        </SettingsList.Item>
        <SettingsList.Item>
          <Button
            label={l`Request VIP`}
            color="primary"
            size="small"
            testID="requestDeltasVipButton"
            onPress={() => openComposer({
              text: '@kris.kralsei.stream can I get the VIP pls',
            })}>
            <ButtonText>
              <Trans>Request VIP</Trans>
            </ButtonText>
          </Button>
        </SettingsList.Item>
      </RunesScreenLayout>
    )
  }

  return (
    <RunesScreenLayout titleText={l`Deltas+`}>
      <Toggle.Item
        name=""
        label={l`Spoof fediverse posts`}
        value={preferences.spoofFediversePost}
        onChange={value => setPreference('spoofFediversePost', value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={Fediverse} />
          <SettingsList.ItemText>
            <Trans>Spoof fediverse posts</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>

      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <View style={[a.gap_sm]}>
            <Text>
              <Trans>
                Lets you make your look like they've been bridged from the Fediverse. Lets you spoof its text. Specific to Bridgy Fed.
              </Trans>
            </Text>
            <Text style={[a.font_bold]}>
              <Trans>
                ⚠️ THESE ARE NOT PRIVATE POSTS ⚠️
              </Trans>
            </Text>
          </View>
        </Admonition>
      </SettingsList.Item>

    </RunesScreenLayout>
  )
}

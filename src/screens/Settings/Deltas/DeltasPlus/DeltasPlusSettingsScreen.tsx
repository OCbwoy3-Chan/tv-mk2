import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {DeltasPlusSettingItem} from '#/screens/Settings/Deltas/DeltasPlus/components/DeltasPlusSettingItem'
import {type DeltasPlusSetting} from '#/screens/Settings/Deltas/DeltasPlus/components/types'
import {RunesScreenLayout} from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {Fediverse} from '#/components/icons/Fediverse'
import {Star_Filled_Corner0_Rounded} from '#/components/icons/Star'
import {useDeltasEntitlementQuery} from '#/deltas/lib/deltasEntitlement'
import {useGta6FontQuery} from '#/deltas/lib/useGta6Font'
import {useVipStatusQuery} from '#/deltas/lib/vipEntitlement'
import {useDeltasPreferences} from '#/deltas/preferences'

export function DeltasPlusSettingsScreen() {
  const {t} = useLingui()
  const preferences = useDeltasPreferences()
  const user = useSession()
  const {data: hasVip} = useVipStatusQuery(user.currentAccount?.did)
  const {openComposer} = useOpenComposer()
  const fontQuery = useGta6FontQuery()
  const {data: hasGta6Names} = useDeltasEntitlementQuery(
    'at://did:web:vessel.darkworld.download/party.tenna.entitlement.list/gta6',
    user.currentAccount?.did,
  )

  const DELTASPLUS_MAIN_SETTINGS: DeltasPlusSetting[] = [
    {
      type: 'toggle',
      label: t`Spoof fediverse posts`,
      value: 'spoofFediversePost',
      info: t`Lets you make your look like they've been bridged from the Fediverse. Lets you spoof its text. Specific to Bridgy Fed.`,
      icon: Fediverse,
    },
    {
      type: 'toggle',
      label: t`GTA 6 display names`,
      value: 'gta6Font',
      visible: hasGta6Names === true,
      info: t`Changes the font on display names to the one used in the Grand Theft Auto VI Discord promotion.`,
      icon: Star_Filled_Corner0_Rounded,
    },
    {
      type: 'text',
      label: t`GTA 6 font Blob CID`,
      value: 'gta6FontBlobCid',
      placeholder: 'bafkrei...',
      visible: hasGta6Names === true && preferences.gta6Font,
      trim: true,
      info: fontQuery.isFetching
        ? t`Checking...`
        : fontQuery.isSuccess
          ? t`Font valid! Display names now use it.`
          : t`Upload the "Pricedown for Discord" font to your repository and provide its CID.`,
      error: fontQuery.isError
        ? t`Invalid font, is it on your repo?`
        : undefined,
    },
  ]

  if (hasVip !== true && hasVip !== false) {
    return <RunesScreenLayout titleText={t`Deltas+`}>{null}</RunesScreenLayout>
  }

  if (hasVip === false) {
    return (
      <RunesScreenLayout titleText={t`Deltas+`}>
        <SettingsList.Item>
          <Admonition type="info" style={[a.flex_1]}>
            <Trans>Deltas+ requires a VIP etitlement.</Trans>
          </Admonition>
        </SettingsList.Item>
        <SettingsList.Item>
          <Button
            label={t`Request VIP`}
            color="primary"
            size="small"
            testID="requestDeltasVipButton"
            onPress={() =>
              openComposer({
                text: '@kris.kralsei.stream can I get the VIP pls',
              })
            }>
            <ButtonText>
              <Trans>Request VIP</Trans>
            </ButtonText>
          </Button>
        </SettingsList.Item>
      </RunesScreenLayout>
    )
  }

  return (
    <RunesScreenLayout titleText={t`Deltas+`}>
      {DELTASPLUS_MAIN_SETTINGS.map(setting => (
        <DeltasPlusSettingItem key={setting.value} setting={setting} />
      ))}
    </RunesScreenLayout>
  )
}

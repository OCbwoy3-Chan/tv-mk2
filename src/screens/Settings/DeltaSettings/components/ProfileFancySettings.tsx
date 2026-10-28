import { View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'

import { useOpenComposer } from '#/lib/hooks/useOpenComposer'
import { useSession } from '#/state/session'
import { atoms as a } from '#/alf'
import { Admonition } from '#/components/Admonition'
import { Button, ButtonText } from '#/components/Button'
import * as Layout from '#/components/Layout'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { Text } from '#/components/Typography'
import { useDecorationEntitlementQuery, useMyDecorationSettingsQuery } from '#/features/avatarDecorations'
import { Mu_Logo_Filled } from './mu/MuLogo'
import { DecorationSettings } from './mu/DecorationSettings'

export function DeltaEuroskyProfileSettingsScreen() {
  const { t: l } = useLingui()
  const { openComposer } = useOpenComposer()
  const { currentAccount } = useSession()
  const entitlement = useDecorationEntitlementQuery(currentAccount?.did)
  const myDecor = useMyDecorationSettingsQuery()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Profile decorations</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <SettingsList.Container>
          <View style={[a.p_xl, entitlement.data === false && a.gap_xl]}>
            <View style={[a.gap_sm]}>
              <Text style={[a.text_2xl, a.font_bold]}>
                <Trans>Profile decorations</Trans>
              </Text>
              <Text style={[a.text_md, a.leading_snug]}>
                <Trans>
                  Upgrade your profile with a decorative ring and colored names!
                  It was supposed to be a Eurosky+ exclusive in Mu, but...
                  We ported it. And added more options.
                </Trans>
              </Text>
            </View>
            {entitlement.data === false && (
              <View>
                <Admonition type="apology">
                  <Text>
                    <Trans>
                      Profile customizations will not be visible on tenna.party without the VIP entitlement.
                      A list creates exclusivity, even though this client is super niche!
                      Just tap the button below, you will be added soon enough.
                    </Trans>
                  </Text>
                </Admonition>
                <Button
                  testID="requestDecorationVip"
                  label={l`Request VIP entitlement`}
                  size="small"
                  color="primary"
                  style={[a.mt_lg]}
                  onPress={() =>
                    openComposer({
                      text: '@kris.kralsei.stream can I get the VIP pls',
                    })
                  }>
                  <ButtonText>
                    <Trans>Request VIP entitlement</Trans>
                  </ButtonText>
                </Button>
              </View>
            )}
          </View>
          <DecorationSettings />
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useDecorationEntitlementQuery} from '#/features/avatarDecorations'
import {DecorationSettings} from './mu/DecorationSettings'

export function DeltaEuroskyProfileSettingsScreen() {
  const {t: l} = useLingui()
  const {openComposer} = useOpenComposer()
  const {currentAccount} = useSession()
  const entitlement = useDecorationEntitlementQuery(currentAccount?.did)

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
                  Customize your profile with frames, avatar shapes, and
                  colorful display names. These decorations are inspired by Mu.
                </Trans>
              </Text>
            </View>
            {entitlement.data === false && (
              <View>
                <Admonition type="apology">
                  <Text>
                    <Trans>
                      Profile decorations on tenna.party require VIP access.
                      Use the button below to draft a request for access.
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
                      text: l`@kris.kralsei.stream can I get VIP access, please?`,
                    })
                  }>
                  <ButtonText>
                    <Trans>Request VIP entitlement</Trans>
                  </ButtonText>
                </Button>
              </View>
            )}
          </View>
          {entitlement.data === true && <DecorationSettings />}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

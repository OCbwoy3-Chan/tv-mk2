import { View } from 'react-native'
import { Trans } from '@lingui/react/macro'

import { atoms as a, useBreakpoints, useTheme } from '#/alf'
import * as Layout from '#/components/Layout'
import { TennaQuickLinks } from './components/QuickLinks'
import { DeltasJapanLogoToggle } from './components/JapanLogoToggle'
import { Text } from '#/components/Typography'
import { DeltasBetaBadgeToggle } from './components/BetaBadgeToggle'
import { Separator } from '#/components/Select'

export function DeltaSettingsScreen() {
  const t = useTheme();
  const { gtMobile } = useBreakpoints()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Deltas</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.pt_2xl, a.px_lg, gtMobile && a.px_2xl]}>
          <TennaQuickLinks />
          <View style={[a.pt_lg]}>
            <Text
              style={[
                a.text_md,
                a.font_semi_bold,
                a.pb_md,
                t.atoms.text_contrast_high,
              ]}>
              App
            </Text>
          </View>
          <View
            style={[
              a.w_full,
              a.rounded_md,
              a.overflow_hidden,
              t.atoms.bg_contrast_25
            ]}
          >
            <DeltasJapanLogoToggle />
            <Separator/>
            <DeltasBetaBadgeToggle />
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
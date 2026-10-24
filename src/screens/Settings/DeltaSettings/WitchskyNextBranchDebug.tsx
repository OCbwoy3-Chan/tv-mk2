import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {EnableTheFeaturesButton} from '#/screens/Settings/DeltaSettings/components/wsky-next/EnableTheFeaturesButton'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function DeltaWitchskyNextBranchDebugScreen() {
  const t = useTheme()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>witchsky-next debug</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_xl, a.gap_xl]}>
          <Admonition type="warning">
            <Text>
              This is EXTREMELY UNSTABLE, it can and will break anytime. You are
              testing unreleased social-app features and features that will be
              merged into the prod versions of Witchsky (and in extension
              tenna.party) they update!
            </Text>
          </Admonition>
          <View style={[a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>Feature gates helper</Text>
            <Text style={[a.text_md, a.leading_snug]}>
              Enable the unreleased & extremely unstable features here.
            </Text>
          </View>
          <View
            style={[
              a.w_full,
              a.rounded_lg,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_50,
            ]}>
            <View style={[a.p_md]}>
              <Text style={[a.mb_md]}>Restart your client after these.</Text>
              <EnableTheFeaturesButton />
            </View>
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

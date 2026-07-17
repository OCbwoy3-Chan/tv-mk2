import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Separator} from '#/components/Select'
import {Text} from '#/components/Typography'
import {CustomLabelToggle} from './components/CustomLabelToggle'

export function DeltaBadgeSettingsScreen() {
  const t = useTheme()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Profile badges</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_xl, a.gap_xl]}>
          <View style={[a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>Profile badges</Text>
            <Text style={[a.text_md, a.leading_snug]}>
              These labels let the world know who you are on supported clients.
              If turned on, this label appears next to your account's name on
              your profile and posts. It can be turned on or off at any time.
            </Text>
            {/* TODO PATCH PROFILEBADGES.TSX */}
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
              <CustomLabelToggle isChild label="Lightner" value="lightner" />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle isChild label="Darkner" value="darkner" />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle isChild label="Tenna" value="tenna" />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle isChild label="Pet" value="pet" />
            </View>
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
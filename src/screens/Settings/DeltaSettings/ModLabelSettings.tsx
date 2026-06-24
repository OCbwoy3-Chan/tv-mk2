import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Separator} from '#/components/Select'
import {Text} from '#/components/Typography'
import {CustomLabelToggle} from './components/CustomLabelToggle'

export function DeltaModLabelSettingsScreen() {
  const t = useTheme()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Moderation labels</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_xl, a.gap_xl]}>
          <View style={[a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>Moderation labels</Text>
            <Text style={[a.text_md, a.leading_snug]}>
              These are ATProto global label values. They redact specific
              content on your profile (e.g. profile picture, banner and posts)
              based on your selection.
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
              <CustomLabelToggle isChild label="Porn" value="porn" />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle
                isChild
                label="Sexually Suggestive"
                value="sexual"
              />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle
                isChild
                label="Non-sexual Nudity"
                value="nudity"
              />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle
                isChild
                label="Graphic Media"
                value="graphic-media"
              />
            </View>
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
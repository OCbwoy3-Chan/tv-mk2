import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Separator} from '#/components/Select'
import {Text} from '#/components/Typography'
import {CustomLabelToggle} from './components/CustomLabelToggle'

export function DeltaModLabelSettingsScreen() {
  const t = useTheme()
  const {t: l} = useLingui()

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
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Moderation labels</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                Add moderation labels to your profile. Supported clients may
                hide or warn about your profile picture, banner, and posts
                according to their moderation settings.
              </Trans>
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
              <CustomLabelToggle isChild label={l`Porn`} value="porn" />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle
                isChild
                label={l`Sexually suggestive`}
                value="sexual"
              />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle
                isChild
                label={l`Non-sexual nudity`}
                value="nudity"
              />
            </View>
            <Separator />
            <View style={[a.p_md]}>
              <CustomLabelToggle
                isChild
                label={l`Graphic media`}
                value="graphic-media"
              />
            </View>
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {CustomLabelToggle} from './components/CustomLabelToggle'
import {FictionkinBadgeSettings} from './components/FictonkinBadgeSettings'

export function DeltaBadgeSettingsScreen() {
  const t = useTheme()
  const {t: l} = useLingui()

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
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Profile badges</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                Add badges that appear next to your name on your profile and
                posts in supported clients. You can turn them off at any time.
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
              <CustomLabelToggle isChild label={l`Pet`} value="pet" />
            </View>
          </View>
        </View>
        <FictionkinBadgeSettings />
      </Layout.Content>
    </Layout.Screen>
  )
}

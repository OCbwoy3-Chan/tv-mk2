import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useHapticsDisabled,
  useRequireAltTextEnabled,
  useSetHapticsDisabled,
  useSetRequireAltTextEnabled,
} from '#/state/preferences'
import {
  useLargeAltBadgeEnabled,
  useSetLargeAltBadgeEnabled,
} from '#/state/preferences/large-alt-badge'
import {useAltTextAiProvider} from '#/state/preferences/openrouter'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {Haptic_Stroke2_Corner2_Rounded as HapticIcon} from '#/components/icons/Haptic'
import {Lab_Stroke2_Corner0_Rounded as BeakerIcon} from '#/components/icons/Lab'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AccessibilitySettings'
>

export function AccessibilitySettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const t = useTheme()
  const requireAltTextEnabled = useRequireAltTextEnabled()
  const setRequireAltTextEnabled = useSetRequireAltTextEnabled()
  const hapticsDisabled = useHapticsDisabled()
  const setHapticsDisabled = useSetHapticsDisabled()
  const largeAltBadgeEnabled = useLargeAltBadgeEnabled()
  const setLargeAltBadgeEnabled = useSetLargeAltBadgeEnabled()
  const altTextAiProvider = useAltTextAiProvider()
  const providerName =
    altTextAiProvider === 'none'
      ? l`None`
      : altTextAiProvider === 'cocore'
        ? l`co/core`
        : altTextAiProvider === 'openrouter'
          ? l`OpenRouter`
          : l`OpenAI-compatible API`

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Accessibility</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={AccessibilityIcon} />
            <SettingsList.ItemText>
              <Trans>Alt text</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="require_alt_text"
              label={l`Warn before posting without alt text`}
              value={requireAltTextEnabled ?? false}
              onChange={setRequireAltTextEnabled}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Warn before posting without alt text</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="large_alt_badge"
              label={l`Display larger alt text badges`}
              value={!!largeAltBadgeEnabled}
              onChange={setLargeAltBadgeEnabled}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Display larger alt text badges</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Divider />

          <SettingsList.LinkItem
            to="/settings/accessibility/ai-alt-text"
            label={l`Automatic alt text generation, ${providerName}`}>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <View style={[a.flex_1, a.gap_2xs]}>
              <SettingsList.ItemText>
                <Trans>Automatic alt text generation</Trans>
              </SettingsList.ItemText>
              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {providerName}
              </Text>
            </View>
          </SettingsList.LinkItem>

          {IS_NATIVE && (
            <>
              <SettingsList.Divider />
              <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
                <SettingsList.ItemIcon icon={HapticIcon} />
                <SettingsList.ItemText>
                  <Trans>Haptics</Trans>
                </SettingsList.ItemText>
                <Toggle.Item
                  name="haptics"
                  label={l`Disable haptic feedback`}
                  value={hapticsDisabled ?? false}
                  onChange={setHapticsDisabled}
                  style={[a.w_full]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    <Trans>Disable haptic feedback</Trans>
                  </Toggle.LabelText>
                  <Toggle.Platform />
                </Toggle.Item>
              </SettingsList.Group>
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

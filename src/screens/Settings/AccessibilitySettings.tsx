import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  DEFAULT_ALT_TEXT_AI_MODEL,
  DEFAULT_ALT_TEXT_AI_PROMPT,
} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
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
import {
  useOpenRouterApiKey,
  useOpenRouterConfigured,
  useOpenRouterModel,
  useOpenRouterPrompt,
  useSetOpenRouterApiKey,
  useSetOpenRouterModel,
  useSetOpenRouterPrompt,
} from '#/state/preferences/openrouter'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {Haptic_Stroke2_Corner2_Rounded as HapticIcon} from '#/components/icons/Haptic'
import {Lab_Stroke2_Corner0_Rounded as BeakerIcon} from '#/components/icons/Lab'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AccessibilitySettings'
>
export function AccessibilitySettingsScreen({}: Props) {
  const {t: l} = useLingui()

  const requireAltTextEnabled = useRequireAltTextEnabled()
  const setRequireAltTextEnabled = useSetRequireAltTextEnabled()
  const hapticsDisabled = useHapticsDisabled()
  const setHapticsDisabled = useSetHapticsDisabled()
  const largeAltBadgeEnabled = useLargeAltBadgeEnabled()
  const setLargeAltBadgeEnabled = useSetLargeAltBadgeEnabled()

  const setOpenRouterApiKeyControl = Dialog.useDialogControl()
  const openRouterConfigured = useOpenRouterConfigured()
  const openRouterModel = useOpenRouterModel()
  const setOpenRouterModelControl = Dialog.useDialogControl()
  const setOpenRouterPromptControl = Dialog.useDialogControl()

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
              label={l`Require alt text before posting`}
              value={requireAltTextEnabled ?? false}
              onChange={value => setRequireAltTextEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Require alt text before posting</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="large_alt_badge"
              label={l`Display larger alt text badges`}
              value={!!largeAltBadgeEnabled}
              onChange={value => setLargeAltBadgeEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Display larger alt text badges</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>
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
                  onChange={value => setHapticsDisabled(value)}
                  style={[a.w_full]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    <Trans>Disable haptic feedback</Trans>
                  </Toggle.LabelText>
                  <Toggle.Platform />
                </Toggle.Item>
              </SettingsList.Group>
            </>
          )}

          <SettingsList.Item>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <SettingsList.ItemText>
              <Trans>OpenRouter API Key</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeButton
              label={openRouterConfigured ? l`Change` : l`Set`}
              onPress={() => setOpenRouterApiKeyControl.open()}
            />
          </SettingsList.Item>

          <SettingsList.Item>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                Set your OpenRouter API key to enable AI-powered alt text
                generation for images in the composer. Get an API key at{' '}
                <InlineLinkText
                  to="https://openrouter.ai"
                  label="openrouter.ai">
                  openrouter.ai
                </InlineLinkText>
              </Trans>
            </Admonition>
          </SettingsList.Item>

          {openRouterConfigured && (
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={BeakerIcon} />
              <SettingsList.ItemText>
                <Trans>{`OpenRouter Model`}</Trans>
              </SettingsList.ItemText>
              <SettingsList.BadgeButton
                label={l`Change`}
                onPress={() => setOpenRouterModelControl.open()}
              />
            </SettingsList.Item>
          )}

          {openRouterConfigured && (
            <SettingsList.Item>
              <Admonition type="info" style={[a.flex_1]}>
                <Trans>
                  Current model: {openRouterModel ?? DEFAULT_ALT_TEXT_AI_MODEL}.{' '}
                  <InlineLinkText
                    to="https://openrouter.ai/models?fmt=cards&input_modalities=image&order=most-popular"
                    label="openrouter.ai">
                    Search models
                  </InlineLinkText>
                </Trans>
              </Admonition>
            </SettingsList.Item>
          )}

          {openRouterConfigured && (
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={BeakerIcon} />
              <SettingsList.ItemText>
                <Trans>Alt Text Prompt</Trans>
              </SettingsList.ItemText>
              <SettingsList.BadgeButton
                label={l`Change`}
                onPress={() => setOpenRouterPromptControl.open()}
              />
            </SettingsList.Item>
          )}

          {openRouterConfigured && (
            <SettingsList.Item>
              <Admonition type="info" style={[a.flex_1]}>
                <Trans>
                  Customize the prompt sent to the AI model when generating alt
                  text. Leave empty to use the default prompt.
                </Trans>
              </Admonition>
            </SettingsList.Item>
          )}

          <OpenRouterApiKeyDialog control={setOpenRouterApiKeyControl} />
          <OpenRouterModelDialog control={setOpenRouterModelControl} />
          <OpenRouterPromptDialog control={setOpenRouterPromptControl} />
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function OpenRouterApiKeyDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const apiKey = useOpenRouterApiKey()
  const [value, setValue] = useState(apiKey ?? '')
  const setApiKey = useSetOpenRouterApiKey()

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(apiKey ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`OpenRouter API Key`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>OpenRouter API Key</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="API Key"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setValue}
            placeholder="sk-or-..."
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => {
              setApiKey(value.trim() || undefined)
              control.close()
            }}
            accessibilityHint={l`Enter your OpenRouter API key for AI alt text generation`}
            defaultValue={apiKey ?? ''}
            secureTextEntry
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => {
                setApiKey(value.trim() || undefined)
                control.close()
              }}
              variant="solid"
              color="primary">
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function OpenRouterModelDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const model = useOpenRouterModel()
  const [value, setValue] = useState(model ?? '')
  const setModel = useSetOpenRouterModel()

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(model ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`OpenRouter Model`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>OpenRouter Model</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Model"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setValue}
            placeholder={DEFAULT_ALT_TEXT_AI_MODEL}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => {
              setModel(value.trim() || undefined)
              control.close()
            }}
            accessibilityHint={l`Enter the model ID to use for alt text generation`}
            defaultValue={model ?? ''}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => {
                setModel(value.trim() || undefined)
                control.close()
              }}
              variant="solid"
              color="primary">
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function OpenRouterPromptDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const prompt = useOpenRouterPrompt()
  const [value, setValue] = useState(prompt ?? '')
  const setPrompt = useSetOpenRouterPrompt()

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(prompt ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Alt Text Prompt`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Alt Text Prompt</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Prompt"
            multiline
            numberOfLines={6}
            style={[
              styles.textInput,
              pal.border,
              pal.text,
              {minHeight: 120, textAlignVertical: 'top'},
            ]}
            onChangeText={setValue}
            placeholder={DEFAULT_ALT_TEXT_AI_PROMPT}
            placeholderTextColor={pal.colors.textLight}
            accessibilityHint={l`Enter a custom prompt for AI alt text generation`}
            defaultValue={prompt ?? ''}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => {
                setPrompt(value.trim() || undefined)
                control.close()
              }}
              variant="solid"
              color="primary">
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

const styles = {
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
}

import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {DEFAULT_ALT_TEXT_AI_PROMPT} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  type AltTextAiProvider,
  useAltTextAiApiKey,
  useAltTextAiBaseUrl,
  useAltTextAiModel,
  useAltTextAiPrompt,
  useAltTextAiProvider,
  useSetAltTextAiApiKey,
  useSetAltTextAiModel,
  useSetAltTextAiPrompt,
  useSetAltTextAiProvider,
  useSetOpenAiCompatibleBaseUrl,
} from '#/state/preferences/openrouter'
import {OpenRouterModelPickerDialog} from '#/screens/Settings/components/OpenRouterModelPickerDialog'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AltTextAiSettings'>

export function AltTextAiSettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const provider = useAltTextAiProvider()
  const setProvider = useSetAltTextAiProvider()
  const apiKey = useAltTextAiApiKey()
  const baseUrl = useAltTextAiBaseUrl()
  const model = useAltTextAiModel()
  const setModel = useSetAltTextAiModel()
  const apiKeyControl = Dialog.useDialogControl()
  const modelControl = Dialog.useDialogControl()
  const promptControl = Dialog.useDialogControl()
  const baseUrlControl = Dialog.useDialogControl()
  const providerItems = [
    {value: 'none', label: l`None`},
    {value: 'cocore', label: l`co/core`},
    {value: 'openrouter', label: l`OpenRouter`},
    {value: 'openaiCompatible', label: l`OpenAI-compatible API`},
  ] as const
  const providerName =
    providerItems.find(item => item.value === provider)?.label ?? provider

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Automatic alt text generation</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Provider</Trans>
            </SettingsList.ItemText>
            <View style={[a.w_full]}>
              <Select.Root
                value={provider}
                onValueChange={value =>
                  setProvider(value as AltTextAiProvider)
                }>
                <Select.Trigger label={l`Select AI alt text provider`}>
                  <Select.ValueText />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Content
                  label={l`AI alt text provider`}
                  items={[...providerItems]}
                  renderItem={({label, value}) => (
                    <Select.Item value={value} label={label}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{label}</Select.ItemText>
                    </Select.Item>
                  )}
                />
              </Select.Root>
            </View>
          </SettingsList.Group>

          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>
                Please avoid using this feature, it uses LLM text generation, it is a pain in the ass to remove entirely.
              </Trans>
            </Admonition>
          </SettingsList.Item>

          {provider === 'none' ? (
            <SettingsList.Item>
              <Admonition type="info" style={[a.flex_1]}>
                <Trans>Automatic alt text generation is turned off.</Trans>
              </Admonition>
            </SettingsList.Item>
          ) : provider === 'cocore' ? (
            <SettingsList.Item>
              <Admonition type="info" style={[a.flex_1]}>
                <Trans>
                  co/core is automatic. Witchsky mints a short-lived AT Protocol
                  service-auth token and selects the best vision model currently
                  online. No API key or model setup is needed. If co/core
                  requires one-time account connection, visit{' '}
                  <InlineLinkText to="https://cocore.dev" label="cocore.dev">
                    cocore.dev
                  </InlineLinkText>
                  .
                </Trans>
              </Admonition>
            </SettingsList.Item>
          ) : (
            <>
              {provider === 'openrouter' && (
                <SettingsList.Item>
                  <SettingsList.ItemText>
                    <Trans>API key</Trans>
                  </SettingsList.ItemText>
                  <SettingsList.BadgeButton
                    label={apiKey ? l`Change` : l`Set`}
                    onPress={() => apiKeyControl.open()}
                  />
                </SettingsList.Item>
              )}

              {provider === 'openaiCompatible' && (
                <>
                  <SettingsList.Item>
                    <SettingsList.ItemText>
                      <Trans>API base URL</Trans>
                    </SettingsList.ItemText>
                    <SettingsList.BadgeButton
                      label={baseUrl ? l`Change` : l`Set`}
                      onPress={() => baseUrlControl.open()}
                    />
                  </SettingsList.Item>
                  <SettingsList.Item>
                    <SettingsList.ItemText>
                      <Trans>API key</Trans>
                    </SettingsList.ItemText>
                    <SettingsList.BadgeButton
                      label={apiKey ? l`Change` : l`Set`}
                      onPress={() => apiKeyControl.open()}
                    />
                  </SettingsList.Item>
                </>
              )}

              <SettingsList.Item>
                <SettingsList.ItemText>
                  <Trans>Vision model</Trans>
                </SettingsList.ItemText>
                <SettingsList.BadgeButton
                  label={model ? l`Change` : l`Choose`}
                  onPress={() => modelControl.open()}
                />
              </SettingsList.Item>

              <SettingsList.Item>
                <Admonition type="info" style={[a.flex_1]}>
                  {provider === 'openrouter' ? (
                    <Trans>
                      Choose an image-capable model from OpenRouter's live
                      catalog. Get an API key at{' '}
                      <InlineLinkText
                        to="https://openrouter.ai/keys"
                        label="openrouter.ai">
                        openrouter.ai
                      </InlineLinkText>
                      .
                    </Trans>
                  ) : (
                    <Trans>
                      Enter the base URL and model ID for any API that supports
                      OpenAI-compatible image inputs and chat completions. Local
                      services may not require an API key.
                    </Trans>
                  )}
                </Admonition>
              </SettingsList.Item>
            </>
          )}

          {provider !== 'none' && (
            <>
              <SettingsList.Divider />

              <SettingsList.Item>
                <SettingsList.ItemText>
                  <Trans>Alt text prompt</Trans>
                </SettingsList.ItemText>
                <SettingsList.BadgeButton
                  label={l`Change`}
                  onPress={() => promptControl.open()}
                />
              </SettingsList.Item>
            </>
          )}

          {provider !== 'none' && provider !== 'cocore' && (
            <>
              <ApiKeyDialog
                key={provider}
                control={apiKeyControl}
                providerName={providerName}
                optional={provider === 'openaiCompatible'}
              />
              {provider === 'openrouter' ? (
                <OpenRouterModelPickerDialog
                  control={modelControl}
                  model={model}
                  onSave={setModel}
                />
              ) : (
                <ModelDialog
                  control={modelControl}
                  providerName={providerName}
                />
              )}
              <BaseUrlDialog control={baseUrlControl} />
            </>
          )}
          {provider !== 'none' && <PromptDialog control={promptControl} />}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function ApiKeyDialog({
  control,
  providerName,
  optional,
}: {
  control: Dialog.DialogControlProps
  providerName: string
  optional: boolean
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()
  const apiKey = useAltTextAiApiKey()
  const setApiKey = useSetAltTextAiApiKey()
  const [value, setValue] = useState(apiKey ?? '')
  const save = () => {
    setApiKey(value.trim() || undefined)
    control.close()
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(apiKey ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`AI provider API key`}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            {optional ? (
              <Trans>API key</Trans>
            ) : (
              <Trans>{providerName} API key</Trans>
            )}
          </Text>
          <Dialog.Input
            label={l`API key`}
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setValue}
            placeholder={optional ? l`Leave blank if not required` : l`API key`}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={save}
            defaultValue={apiKey ?? ''}
            secureTextEntry
            clearButtonMode="while-editing"
          />
          <SaveButton onPress={save} isEmpty={!value.trim()} />
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ModelDialog({
  control,
  providerName,
}: {
  control: Dialog.DialogControlProps
  providerName: string
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()
  const model = useAltTextAiModel()
  const setModel = useSetAltTextAiModel()
  const [value, setValue] = useState(model ?? '')
  const save = () => {
    setModel(value.trim() || undefined)
    control.close()
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(model ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Vision model`}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>{providerName} vision model</Trans>
          </Text>
          <Dialog.Input
            label={l`Model ID`}
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setValue}
            placeholder={l`Model ID`}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={save}
            defaultValue={model ?? ''}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <SaveButton onPress={save} isEmpty={!value.trim()} />
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function BaseUrlDialog({control}: {control: Dialog.DialogControlProps}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()
  const baseUrl = useAltTextAiBaseUrl()
  const setBaseUrl = useSetOpenAiCompatibleBaseUrl()
  const [value, setValue] = useState(baseUrl ?? '')
  const save = () => {
    setBaseUrl(value.trim() || undefined)
    control.close()
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(baseUrl ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`API base URL`}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>API base URL</Trans>
          </Text>
          <Dialog.Input
            label={l`API base URL`}
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setValue}
            placeholder="https://example.com/v1"
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={save}
            defaultValue={baseUrl ?? ''}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            clearButtonMode="while-editing"
          />
          <Text style={[a.text_sm]}>
            <Trans>
              Use the API base URL, usually ending in /v1. A full
              /chat/completions URL also works.
            </Trans>
          </Text>
          <SaveButton onPress={save} isEmpty={!value.trim()} />
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function PromptDialog({control}: {control: Dialog.DialogControlProps}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()
  const prompt = useAltTextAiPrompt()
  const setPrompt = useSetAltTextAiPrompt()
  const effectivePrompt = prompt ?? DEFAULT_ALT_TEXT_AI_PROMPT
  const [value, setValue] = useState(effectivePrompt)
  useEffect(() => setValue(effectivePrompt), [effectivePrompt])
  const done = () => {
    const next = value.trim()
    setPrompt(next === DEFAULT_ALT_TEXT_AI_PROMPT ? undefined : next)
    control.close()
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setValue(effectivePrompt)}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Alt text prompt`}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Alt text prompt</Trans>
          </Text>
          <Dialog.Input
            label={l`Prompt`}
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
            value={value}
            clearButtonMode="while-editing"
          />
          <ActionButton
            label={!value.trim() ? l`Clear` : l`Done`}
            onPress={done}>
            {!value.trim() ? <Trans>Clear</Trans> : <Trans>Done</Trans>}
          </ActionButton>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function SaveButton({
  onPress,
  isEmpty,
}: {
  onPress: () => void
  isEmpty: boolean
}) {
  const {t: l} = useLingui()
  return (
    <ActionButton label={isEmpty ? l`Clear` : l`Save`} onPress={onPress}>
      {isEmpty ? <Trans>Clear</Trans> : <Trans>Save</Trans>}
    </ActionButton>
  )
}

function ActionButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <View style={IS_WEB && [a.flex_row, a.justify_end]}>
      <Button
        label={label}
        size="large"
        onPress={onPress}
        disabled={disabled}
        variant="solid"
        color="primary">
        <ButtonText>{children}</ButtonText>
      </Button>
    </View>
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

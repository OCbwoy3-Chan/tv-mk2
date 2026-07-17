import {useState} from 'react'
import {Keyboard, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  isValidAtprotoTidPrefix,
  isValidAtprotoTidSuffix,
  normalizeAtprotoRkey,
} from '#/lib/crack/atproto-rkey'
import { useCustomPostRkeysEnabled } from '#/state/preferences'
import { useAtprotoRkeySettings, useSetAtprotoRkeySettings } from '#/state/preferences/atproto-rkey-settings'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

type GenerationMode = 'tid' | 'prefix' | 'suffix'

export function AtprotoBtn({
  generation,
  prefix,
  suffix,
  onChangeSettings,
}: {
  generation: GenerationMode
  prefix: string
  suffix: string
  onChangeSettings: (
    generation: GenerationMode,
    prefix: string,
    suffix: string,
  ) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const rkeysEnabled = useCustomPostRkeysEnabled();
  const update = useSetAtprotoRkeySettings()
  const settings = useAtprotoRkeySettings();
  const control = Dialog.useDialogControl()
  const [draftGeneration, setDraftGeneration] = useState<GenerationMode>('tid')
  const [draftPrefix, setDraftPrefix] = useState('')
  const [draftSuffix, setDraftSuffix] = useState('')
  const [persist, setPersist] = useState(false)
  const [inputVersion, setInputVersion] = useState(0)
  const isUsingCustomRkey = generation === 'prefix' || generation === 'suffix'

  if (!rkeysEnabled) {
    return null
  }

  const onPress = () => {
    Keyboard.dismiss()
    setDraftGeneration(generation)
    setDraftPrefix(prefix)
    setDraftSuffix(suffix)
    setPersist(false)
    setInputVersion(v => v + 1)
    control.open()
  }

  const normalizedPrefix = normalizeAtprotoRkey(draftPrefix)
  const normalizedSuffix = normalizeAtprotoRkey(draftSuffix)
  const effectivePrefix = draftGeneration === 'prefix' ? normalizedPrefix : ''
  const effectiveSuffix = draftGeneration === 'suffix' ? normalizedSuffix : ''

  const isPrefixValid =
    draftGeneration !== 'prefix' || isValidAtprotoTidPrefix(normalizedPrefix)
  const isSuffixValid =
    draftGeneration !== 'suffix' || isValidAtprotoTidSuffix(normalizedSuffix)
  const isValid = isPrefixValid && isSuffixValid

  const isDirtyFromDefaults =
    draftGeneration !== settings.generation ||
    effectivePrefix !== settings.prefix ||
    effectiveSuffix !== (settings.suffix ?? '')

  const onSave = () => {
    if (!isValid) return
    console.log('[AtprotoBtn] onSave: persist=', persist, 'draft=', draftGeneration, effectivePrefix, effectiveSuffix)
    if (persist) {
      update({
        generation: draftGeneration,
        prefix: effectivePrefix,
        suffix: effectiveSuffix,
      })
    }
    onChangeSettings(draftGeneration, effectivePrefix, effectiveSuffix)
    control.close()
  }

  return (
    <>
      <Button
        color="secondary"
        size="small"
        testID="openAtprotoSettingsButton"
        onPress={onPress}
        label={
          isUsingCustomRkey
            ? _(msg`Custom Record Key`)
            : _(msg`Timestamp-ID (TID) Record Key`)
        }
        accessibilityHint={_(
          msg`Opens a dialog to configure ATProto record key generation`,
        )}>
        <ButtonText maxFontSizeMultiplier={2} numberOfLines={1}>
          {isUsingCustomRkey ? (
            draftGeneration === "prefix" ? _(msg`TID Prefix`)
            : _(msg`TID Suffix`)
          ) : _(msg`Record Key`)}
        </ButtonText>
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`ATProto settings`)}
          style={[web({maxWidth: 400}), a.w_full]}>
          <View style={[a.gap_lg]}>
            <Text style={[a.text_2xl, a.font_semi_bold]}>
              <Trans>Record Key</Trans>
            </Text>

            <View style={[a.gap_sm]}>
              <Text style={[a.text_md, a.font_medium]}>
                <Trans>Type</Trans>
              </Text>

              <Toggle.Group
                label={_(msg`Choose how record keys are generated`)}
                type="radio"
                maxSelections={1}
                values={[draftGeneration]}
                onChange={values => {
                  if (values.includes('prefix')) {
                    setDraftGeneration('prefix')
                  } else if (values.includes('suffix')) {
                    setDraftGeneration('suffix')
                  } else {
                    setDraftGeneration('tid')
                  }
                }}>
                <View style={[a.flex_row, a.gap_sm]}>
                  <Toggle.Item
                    name="tid"
                    type="checkbox"
                    label={_(msg`TID`)}
                    style={[a.flex_1]}>
                    {({selected}) => (
                      <Toggle.Panel active={selected}>
                        <Toggle.Radio />
                        <Toggle.PanelText>
                          <Trans>TID</Trans>
                        </Toggle.PanelText>
                      </Toggle.Panel>
                    )}
                  </Toggle.Item>
                  <Toggle.Item
                    name="prefix"
                    type="checkbox"
                    label={_(msg`Prefix`)}
                    style={[a.flex_1]}>
                    {({selected}) => (
                      <Toggle.Panel active={selected}>
                        <Toggle.Radio />
                        <Toggle.PanelText>
                          <Trans>Prefix</Trans>
                        </Toggle.PanelText>
                      </Toggle.Panel>
                    )}
                  </Toggle.Item>
                  <Toggle.Item
                    name="suffix"
                    type="checkbox"
                    label={_(msg`Suffix`)}
                    style={[a.flex_1]}>
                    {({selected}) => (
                      <Toggle.Panel active={selected}>
                        <Toggle.Radio />
                        <Toggle.PanelText>
                          <Trans>Suffix</Trans>
                        </Toggle.PanelText>
                      </Toggle.Panel>
                    )}
                  </Toggle.Item>
                </View>
              </Toggle.Group>
            </View>

            {draftGeneration === 'prefix' && (
              <View style={[a.gap_sm]}>
                <TextField.LabelText>
                  <Trans>Prefix</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <Dialog.Input
                    key={`prefix-${inputVersion}`}
                    label={_(msg`Record key prefix`)}
                    defaultValue={draftPrefix}
                    placeholder={_(msg`e.g. gerson`)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    onChangeText={setDraftPrefix}
                  />
                </TextField.Root>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>
                    Prefix must use TID characters. If shorter than 13 chars, a
                    timestamp-based TID suffix fills the remainder.
                  </Trans>
                </Text>
                {!isPrefixValid && (
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>
                      Invalid prefix. Use 1-13 chars from
                      234567abcdefghijklmnopqrstuvwxyz. First char must be one
                      of 234567abcdefghij.
                    </Trans>
                  </Text>
                )}
              </View>
            )}

            {draftGeneration === 'suffix' && (
              <View style={[a.gap_sm]}>
                <TextField.LabelText>
                  <Trans>Suffix</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <Dialog.Input
                    key={`suffix-${inputVersion}`}
                    label={_(msg`Record key suffix`)}
                    defaultValue={draftSuffix}
                    placeholder={_(msg`e.g. -cool`)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    onChangeText={setDraftSuffix}
                  />
                </TextField.Root>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>
                    Suffix replaces the last N chars of the TID, keeping a valid
                    13-char record key. Use TID characters
                    (234567abcdefghijklmnopqrstuvwxyz), max 12 chars.
                  </Trans>
                </Text>
                {!isSuffixValid && (
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>
                      Invalid suffix. Use 1-12 chars from
                      234567abcdefghijklmnopqrstuvwxyz.
                    </Trans>
                  </Text>
                )}
              </View>
            )}

            <View style={[{minHeight: 24}, a.justify_center]}>
              {isDirtyFromDefaults ? (
                <Toggle.Item
                  name="persist"
                  type="checkbox"
                  label={_(msg`Save these options for next time`)}
                  value={persist}
                  onChange={() => setPersist(v => !v)}>
                  <Toggle.Checkbox />
                  <Toggle.LabelText
                    style={[a.text_md, a.font_normal, t.atoms.text]}>
                    <Trans>Save these options for next time</Trans>
                  </Toggle.LabelText>
                </Toggle.Item>
              ) : (
                <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                  <Trans>These are your default settings</Trans>
                </Text>
              )}
            </View>

            <View style={[a.flex_row, a.justify_end, a.gap_sm]}>
              <Button
                label={_(msg`Save`)}
                color="primary"
                size="small"
                onPress={onSave}
                disabled={!isValid}>
                <ButtonText>
                  <Trans>Save</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>

          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
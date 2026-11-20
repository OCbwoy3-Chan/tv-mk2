import { useState } from 'react'
import { Keyboard, View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'

import { htmlToSegments } from '#/lib/strings/bridged-html'
import { atoms as a, useTheme, web } from '#/alf'
import { Button, ButtonText } from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import { RichText } from '#/components/RichText'
import { Text } from '#/components/Typography'
import { useDeltasPreferences } from '#/deltas/preferences'
import { useVipStatusQuery } from '#/deltas/lib/vipEntitlement'
import { useSession } from '#/state/session'

export function SpoofFediverseBtn({
  value,
  onChange,
}: {
  value?: string
  onChange: (text?: string) => void
}) {
  const { t: l } = useLingui()
  const t = useTheme()
  const { spoofFediversePost } = useDeltasPreferences()
  const control = Dialog.useDialogControl()
  const [text, setText] = useState('')

  const currentUser = useSession();
  const isVip = useVipStatusQuery(currentUser.currentAccount?.did);

  if (!isVip) return null
  if (!spoofFediversePost) return null
  
  return (
    <>
      <Button
        color="secondary"
        size="small"
        testID="openSpoofFediverseButton"
        label={l`Spoof fediverse post`}
        onPress={() => {
          Keyboard.dismiss()
          setText(value ?? '')
          control.open()
        }}>
        <ButtonText maxFontSizeMultiplier={2} numberOfLines={1}>
          {
            !value
            ? <Trans>Unspoofed</Trans>
            : <Trans>Spoofed fedi post</Trans>
          }
        </ButtonText>
      </Button>
      <Dialog.Outer control={control} nativeOptions={{ preventExpansion: true }}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={l`Spoof fediverse post`}
          style={[web({ maxWidth: 500 }), a.w_full]}>
          <View style={[a.gap_lg]}>
            <View style={[a.gap_sm]}>
              <Text style={[a.text_2xl, a.font_semi_bold]}>
                <Trans>Spoof fediverse post</Trans>
              </Text>
              <Text style={t.atoms.text_contrast_medium}>
                <Trans>
                  Swap out your post's text for those on Witchsky and other clients!
                </Trans>
              </Text>
            </View>
            <View>
              <TextField.LabelText>
                <Trans>Post HTML</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <Dialog.Input
                  testID="spoofFediverseInput"
                  label={l`Post HTML`}
                  placeholder={l`<p>Your post text…</p>`}
                  value={text}
                  onChangeText={setText}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ minHeight: 120 }}
                />
              </TextField.Root>
            </View>
            <View style={[a.gap_xs]}>
              <Text style={[a.font_semi_bold]}>
                <Trans>Preview</Trans>
              </Text>
              <View
                testID="spoofFediversePreview"
                style={[
                  a.p_md,
                  a.border,
                  a.rounded_md,
                  t.atoms.bg_contrast_25,
                  t.atoms.border_contrast_low,
                  { minHeight: 80 },
                ]}>
                {text.trim() ? (
                  <RichText value="" htmlSegments={htmlToSegments(text)} />
                ) : (
                  <Text style={t.atoms.text_contrast_medium}>
                    <Trans>Your post will show here.</Trans>
                  </Text>
                )}
              </View>
            </View>
            {value?.trim() ? (
              <Button
                color="negative_subtle"
                size="small"
                testID="removeSpoofFediverseButton"
                label={l`Unspoof`}
                onPress={() => control.close(() => onChange(undefined))}>
                <ButtonText>
                  <Trans>Unspoof</Trans>
                </ButtonText>
              </Button>
            ) : null}
            <View style={[a.flex_row, a.gap_sm]}>
              <Button
                color="secondary"
                size="large"
                style={[a.flex_1]}
                testID="cancelSpoofFediverseButton"
                label={l`Cancel`}
                onPress={() => control.close()}>
                <ButtonText>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
              <Button
                color="primary"
                size="large"
                style={[a.flex_1]}
                testID="applySpoofFediverseButton"
                label={l`Apply`}
                onPress={() => {
                  control.close(() => onChange(text.trim() ? text : undefined))
                }}>
                <ButtonText>
                  <Trans>Apply</Trans>
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

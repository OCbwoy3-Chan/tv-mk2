import {useState} from 'react'
import {Keyboard, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

export type PostVisibility = 'public' | 'private'

export function PrivatePostBtn({
  value,
  enabled,
  onChange,
}: {
  value: PostVisibility
  enabled: boolean
  onChange: (value: PostVisibility) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()
  const [draft, setDraft] = useState(value)

  if (!enabled) return null

  return (
    <>
      <Button
        color="secondary"
        size="small"
        testID="openPostVisibilityButton"
        onPress={() => {
          Keyboard.dismiss()
          setDraft(value)
          control.open()
        }}
        label={_(msg`Post visibility`)}
        accessibilityHint={_(
          msg`Choose whether this post is public or private`,
        )}>
        <ButtonText numberOfLines={1} maxFontSizeMultiplier={2}>
          {draft === 'private' ? _(msg`Private post`) : _(msg`Public post`)}
        </ButtonText>
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Post visibility`)}
          style={[web({maxWidth: 400}), a.w_full]}>
          <View style={[a.gap_lg]}>
            <Text style={[a.text_2xl, a.font_semi_bold]}>
              <Trans>Post visibility</Trans>
            </Text>
            <Toggle.Group
              label={_(msg`Choose post visibility`)}
              type="radio"
              maxSelections={1}
              values={[draft]}
              onChange={values =>
                setDraft(values.includes('private') ? 'private' : 'public')
              }>
              <View style={[a.flex_row, a.gap_sm]}>
                {(['public', 'private'] as const).map(option => (
                  <Toggle.Item
                    key={option}
                    name={option}
                    type="checkbox"
                    label={
                      option === 'private' ? _(msg`Private`) : _(msg`Public`)
                    }
                    style={[a.flex_1]}>
                    {({selected}) => (
                      <Toggle.Panel active={selected}>
                        <Toggle.Radio />
                        <Toggle.PanelText>
                          {option === 'private' ? (
                            <Trans>Private</Trans>
                          ) : (
                            <Trans>Public</Trans>
                          )}
                        </Toggle.PanelText>
                      </Toggle.Panel>
                    )}
                  </Toggle.Item>
                ))}
              </View>
            </Toggle.Group>
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
              {draft === 'private' ? (
                <Trans>
                  Only your mutuals on tenna.party can read this post. A fallback link will be shared.
                </Trans>
              ) : (
                <Trans>
                  Anyone on Bluesky can view your post.
                </Trans>
              )}
            </Text>
            <View style={[a.flex_row, a.justify_end]}>
              <Button
                color="primary"
                size="small"
                label={_(msg`Save post visibility`)}
                onPress={() => {
                  onChange(draft)
                  control.close()
                }}>
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

import {View} from 'react-native'
import {Image} from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {type PluralSystemMember} from '#/features/plurality/types'

export function SystemMemberDialog({
  control,
  member,
  avatarUrl,
  authorHandle,
}: {
  control: Dialog.DialogControlProps
  member: PluralSystemMember
  avatarUrl?: string
  authorHandle?: string
}) {
  const {_} = useLingui()
  const displayName = member.displayName || member.name || _(msg`Member`)

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={displayName}>
        <SystemMemberDialogInner
          control={control}
          member={member}
          avatarUrl={avatarUrl}
          authorHandle={authorHandle}
        />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function SystemMemberDialogInner({
  control,
  member,
  avatarUrl,
  authorHandle,
}: {
  control: Dialog.DialogControlProps
  member: PluralSystemMember
  avatarUrl?: string
  authorHandle?: string
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const displayName = member.displayName || member.name || _(msg`Member`)
  const initials = (displayName || '?').slice(0, 2)

  const createdAt = member.createdAt
    ? i18n.date(new Date(member.createdAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null
  const updatedAt = member.updatedAt
    ? i18n.date(new Date(member.updatedAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  const onCopyDid = async () => {
    if (!member.did) return
    try {
      await Clipboard.setStringAsync(member.did)
      Toast.show(_(msg`DID copied to clipboard`))
    } catch {
      Toast.show(_(msg`Failed to copy DID`), {type: 'error'})
    }
  }

  return (
    <>
      <Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
        {displayName}
      </Text>

      <View style={[a.flex_row, a.gap_md, a.align_center, a.pb_md, a.pt_sm]}>
        <View
          style={[
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            {width: 84, height: 84},
          ]}>
          {avatarUrl ? (
            <Image
              source={{uri: avatarUrl}}
              accessibilityIgnoresInvertColors
              style={{width: 84, height: 84}}
              contentFit="cover"
            />
          ) : (
            <View style={[a.flex_1, a.justify_center, a.align_center]}>
              <Text style={[a.text_xl, a.font_bold]}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={[a.flex_1, a.gap_xs]}>
          {member.pronouns ? (
            <View
              style={[
                a.self_start,
                a.px_sm,
                a.py_2xs,
                a.rounded_full,
                {backgroundColor: t.palette.primary_500},
              ]}>
              <Text style={[a.text_xs, a.font_bold, {color: t.palette.white}]}>
                {member.pronouns}
              </Text>
            </View>
          ) : null}

          <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
            {createdAt ? (
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Joined: {createdAt}</Trans>
              </Text>
            ) : null}
            {updatedAt ? (
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Updated: {updatedAt}</Trans>
              </Text>
            ) : null}
          </View>

          {member.colour ? (
            <View style={[a.flex_row, a.align_center, a.gap_sm, a.pt_xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Color</Trans>
              </Text>
              <View
                style={[
                  a.rounded_xs,
                  t.atoms.border_contrast_low,
                  a.border,
                  {width: 20, height: 20, backgroundColor: member.colour},
                ]}
              />
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                {member.colour}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {member.bio ? (
        <View style={[a.pb_md]}>
          <RichText
            style={[a.text_md]}
            value={member.bio}
            enableTags
            authorHandle={authorHandle}
          />
        </View>
      ) : null}

      {member.customFields && member.customFields.length > 0 ? (
        <View style={[a.gap_sm, a.pb_md]}>
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>Custom fields</Trans>
          </Text>
          {member.customFields.map((field, index) => (
            <View key={index} style={[a.flex_row, a.gap_sm]}>
              <Text
                style={[
                  a.text_sm,
                  a.font_bold,
                  t.atoms.text_contrast_medium,
                  {minWidth: 64},
                ]}>
                {field.name}
              </Text>
              <Text style={[a.text_sm, a.flex_1, t.atoms.text_contrast_medium]}>
                {field.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {member.did ? (
        <View style={[a.gap_sm, a.pb_md]}>
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>DID</Trans>
          </Text>
          <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
            <Button
              label={_(msg`View profile`)}
              size="small"
              color="primary"
              onPress={() => {
                control.close(() => {
                  navigation.navigate('Profile', {name: member.did!})
                })
              }}>
              <ButtonText>
                <Trans>View profile</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_(msg`Copy DID`)}
              size="small"
              color="secondary"
              onPress={() => void onCopyDid()}>
              <ButtonText>
                <Trans>Copy DID</Trans>
              </ButtonText>
            </Button>
          </View>
          <Text
            style={[
              a.text_sm,
              t.atoms.text_contrast_medium,
              {fontFamily: 'monospace'},
            ]}
            selectable>
            {member.did}
          </Text>
        </View>
      ) : null}
    </>
  )
}

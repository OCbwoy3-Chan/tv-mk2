import {useState} from 'react'
import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {RunesScreenLayout} from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Loader} from '#/components/Loader'
import {Pressable} from '#/components/Pressable'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {type DeltasNavigatorParams} from '#/deltas/DeltasNavigation'
import {
  applyDraftEdit,
  AVATAR_SHAPES,
  type AvatarShape,
  DECORATION_FRAMES,
  type DecorationDraft,
  draftFromSaved,
  draftToPatch,
  getNameGradient,
  isDraftDirty,
  NAME_GRADIENTS,
  type NameGradient,
  nameGradientTextStyle,
  resolveDraft,
  useMyDecorationSettingsQuery,
  useSetDecorations,
} from '#/deltas/feat/avatarDecorations'

type Props = NativeStackScreenProps<
  DeltasNavigatorParams,
  'DeltasDecorationsSettingsScreen'
>

export function DeltasDecorationsSettingsScreen({}: Props) {
  const {currentAccount} = useSession()
  return <DecorationsSettings key={currentAccount?.did} />
}

function DecorationsSettings() {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const profile = useCurrentAccountProfile()
  const settings = useMyDecorationSettingsQuery()
  const setDecorations = useSetDecorations()

  const saved = settings.data ?? {}
  const [draft, setDraft] = useState<DecorationDraft>(() =>
    draftFromSaved(saved),
  )
  const selected = resolveDraft(draft, saved)
  const selectedGradient = getNameGradient(selected.name)
  const dirty = isDraftDirty(draft, saved)

  const previewName = sanitizeDisplayName(
    profile?.displayName || sanitizeHandle(profile?.handle || ''),
  )

  function edit(patch: Partial<Omit<DecorationDraft, 'touched'>>) {
    setDraft(current => applyDraftEdit(current, saved, patch))
  }

  function onSave() {
    const submitted = draftToPatch(draft, saved)
    const submittedDraft = draft
    setDecorations.mutate(submitted, {
      onSuccess: () => {
        setDraft(current =>
          current === submittedDraft ? draftFromSaved(submitted) : current,
        )
        Toast.show(l`Saved`)
      },
      onError: () => Toast.show(l`Could not save. Try again.`),
    })
  }

  return (
    <RunesScreenLayout titleText={l`Profile decorations`}>
      <View style={[a.px_xl, a.pb_lg, a.pt_sm]}>
        <Admonition type="tip">
          <Trans>
            These decorations are only visible on tenna.party. They might not display
            correctly on mobile devices or on Mu with a Eurosky+ subscription.
          </Trans>
        </Admonition>
      </View>

      <View
        style={[
          a.mx_xl,
          a.mb_sm,
          a.p_xl,
          a.rounded_md,
          a.align_center,
          a.justify_center,
          a.gap_md,
          t.atoms.bg_contrast_25,
        ]}>
        <UserAvatar
          type="user"
          size={80}
          avatar={profile?.avatar}
          decoration={DECORATION_FRAMES.find(f => f.id === selected.avatar)}
          profileShape={selected.avatarShape}
        />
        <Text
          emoji
          gradient={selectedGradient}
          style={[
            a.text_2xl,
            a.font_bold,
            t.atoms.text,
            selectedGradient &&
              nameGradientTextStyle(selectedGradient, {
                outline: selected.nameOutline,
              }),
          ]}
          numberOfLines={1}>
          {previewName}
        </Text>
      </View>

      {settings.isLoading && <Loader />}
      {settings.isError && (
        <View style={[a.px_xl, a.pb_lg]}>
          <Button
            label={l`Try again`}
            size="small"
            color="secondary"
            onPress={() => void settings.refetch()}>
            <ButtonText>
              <Trans>Could not load your decorations. Try again.</Trans>
            </ButtonText>
          </Button>
        </View>
      )}

      {settings.isSuccess && (
        <>
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Profile frame</Trans>
            </SettingsList.ItemText>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pb_sm]}>
              <ChoiceButton
                testID="decoration-frame-none"
                label={l`None`}
                selected={!selected.avatar}
                onPress={() => edit({avatar: undefined})}
              />
              {DECORATION_FRAMES.map(item => (
                <ChoiceButton
                  key={item.id}
                  testID={`decoration-frame-${item.id}`}
                  label={i18n._(item.name)}
                  selected={selected.avatar === item.id}
                  onPress={() => edit({avatar: item.id})}
                />
              ))}
            </View>
          </SettingsList.Group>

          <SettingsList.Divider />

          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Avatar shape</Trans>
            </SettingsList.ItemText>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pb_sm]}>
              <ChoiceButton
                testID="avatar-shape-default"
                label={l`Default`}
                selected={!selected.avatarShape}
                onPress={() => edit({avatarShape: undefined})}
              />
              {AVATAR_SHAPES.map(item => (
                <ChoiceButton
                  key={item}
                  testID={`avatar-shape-${item}`}
                  label={i18n._(SHAPE_LABELS[item])}
                  selected={selected.avatarShape === item}
                  onPress={() => edit({avatarShape: item})}
                />
              ))}
            </View>
          </SettingsList.Group>

          <SettingsList.Divider />

          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Display name</Trans>
            </SettingsList.ItemText>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pb_sm]}>
              <NoneSwatch
                testID="decoration-gradient-none"
                selected={!selected.name}
                onPress={() => edit({name: undefined})}
              />
              {NAME_GRADIENTS.map(gradient => (
                <GradientSwatch
                  key={gradient.id}
                  gradient={gradient}
                  selected={selected.name === gradient.id}
                  onPress={() => edit({name: gradient.id})}
                />
              ))}
            </View>
          </SettingsList.Group>

          <SettingsList.Item style={[a.flex_col, a.align_start, a.gap_sm]}>
            <Toggle.Item
              name="decoration_name_outline"
              label={l`Outline`}
              value={selected.nameOutline}
              disabled={!selected.name}
              onChange={value => edit({nameOutline: value})}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1, a.text_lg]}>
                <Trans>Outline</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Text
              style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                Might not work or display correctly.
              </Trans>
            </Text>
          </SettingsList.Item>

          <View style={[a.px_xl, a.py_xl]}>
            <Button
              testID="saveDecorations"
              label={l`Save`}
              size="large"
              color="primary"
              disabled={!dirty || setDecorations.isPending}
              onPress={onSave}>
              <ButtonText>
                {setDecorations.isPending ? (
                  <Trans>Saving…</Trans>
                ) : (
                  <Trans>Save</Trans>
                )}
              </ButtonText>
            </Button>
          </View>
        </>
      )}
    </RunesScreenLayout>
  )
}

const SHAPE_LABELS: Record<AvatarShape, MessageDescriptor> = {
  circle: msg`Circle`,
  square: msg`Square`,
  squircle: msg`Squircle`,
  hexagon: msg`Hexagon`,
  triangle: msg`Triangle`,
}

const SWATCH_HEIGHT = 52

function ChoiceButton({
  testID,
  label,
  selected,
  onPress,
}: {
  testID: string
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Button
      testID={testID}
      label={label}
      accessibilityState={{selected}}
      color={selected ? 'primary' : 'secondary'}
      size="small"
      onPress={onPress}>
      <ButtonText>{label}</ButtonText>
    </Button>
  )
}

function GradientSwatch({
  gradient,
  selected,
  onPress,
}: {
  gradient: NameGradient
  selected: boolean
  onPress: () => void
}) {
  const {i18n} = useLingui()
  const t = useTheme()
  // Hard-stop bands need doubled stops to render as flat color blocks.
  const colors = gradient.segmented
    ? gradient.colors.flatMap(color => [color, color])
    : gradient.colors
  const locations = gradient.segmented
    ? gradient.colors.flatMap((_, index) => [
        index / gradient.colors.length,
        (index + 1) / gradient.colors.length,
      ])
    : undefined
  return (
    <Pressable
      testID={`decoration-gradient-${gradient.id}`}
      accessibilityRole="button"
      accessibilityLabel={i18n._(gradient.name)}
      accessibilityHint=""
      accessibilityState={{selected}}
      onPress={onPress}
      style={[
        a.rounded_md,
        a.overflow_hidden,
        {height: SWATCH_HEIGHT, flexBasis: '31%', flexGrow: 1},
        selected && {borderWidth: 2, borderColor: t.atoms.text.color},
      ]}>
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        locations={locations as [number, number, ...number[]] | undefined}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[a.absolute, a.inset_0]}
      />
      <View style={[a.flex_1, a.align_center, a.justify_center, a.px_sm]}>
        <View
          style={[
            a.rounded_full,
            a.px_xs,
            {maxWidth: '100%', backgroundColor: 'rgba(0, 0, 0, 0.75)'},
          ]}>
          <Text
            numberOfLines={1}
            style={[a.text_sm, a.font_bold, {color: '#FFFFFF'}]}>
            {i18n._(gradient.name)}
          </Text>
        </View>
        {selected && (
          <View
            style={[
              a.absolute,
              a.rounded_full,
              a.align_center,
              a.justify_center,
              {
                top: 4,
                right: 4,
                width: 18,
                height: 18,
                backgroundColor: 'rgba(0,0,0,0.35)',
              },
            ]}>
            <CheckIcon size="xs" fill="#FFFFFF" />
          </View>
        )}
      </View>
    </Pressable>
  )
}

function NoneSwatch({
  testID,
  selected,
  onPress,
}: {
  testID: string
  selected: boolean
  onPress: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={l`None`}
      accessibilityHint=""
      accessibilityState={{selected}}
      onPress={onPress}
      style={[
        a.rounded_md,
        a.align_center,
        a.justify_center,
        t.atoms.bg_contrast_25,
        {height: SWATCH_HEIGHT, flexBasis: '31%', flexGrow: 1},
        selected
          ? {borderWidth: 2, borderColor: t.atoms.text.color}
          : {
              borderWidth: 1,
              borderColor: t.atoms.border_contrast_low.borderColor,
            },
      ]}>
      <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
        <Trans>None</Trans>
      </Text>
    </Pressable>
  )
}

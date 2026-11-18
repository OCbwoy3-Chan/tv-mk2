import { Image, type ImageSourcePropType, type Insets, View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'

import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped'
import { atoms as a, web } from '#/alf'
import { Button, ButtonText } from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import { Text } from '#/components/Typography'
import { type AnyProfileView } from '#/types/bsky/profile'

const THE_BADGES: Record<string, { name: string; img: ImageSourcePropType }> = {
  'did:plc:vshnclkqqguyg6xcz6q7g65k': {
    name: 'Toby',
    img: require('#/../assets/badges/toby.png'),
  },
}

export function hasPremiumBadge(profile: AnyProfileView) {
  return Object.hasOwn(THE_BADGES, profile.did)
}

export function VipBadge({
  profile,
  width,
  interactive,
  hitSlop,
}: {
  profile: AnyProfileView
  width: number
  interactive: boolean
  hitSlop: Insets
}) {
  const { t: l } = useLingui()
  const badge = hasPremiumBadge(profile) ? THE_BADGES[profile.did] : undefined
  if (!badge) return null
  return (
    <ProfileBadge
      source={badge.img}
      title={l`Premium`}
      description={badge.name}
      width={width}
      interactive={interactive}
      hitSlop={hitSlop}
    />
  )
}

export function ProfileBadge({
  source,
  title,
  description,
  width,
  interactive,
  hitSlop,
  showSettings = false,
}: {
  source: ImageSourcePropType
  title: string
  description: string
  width: number
  interactive: boolean
  hitSlop: Insets
  showSettings?: boolean
}) {
  const { t: l } = useLingui()
  const control = Dialog.useDialogControl()
  const navigation = useNavigationDeduped()

  function icon(size: number) {
    return (
      <Image
        source={source}
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    )
  }

  if (!interactive) {
    return (
      <View accessibilityLabel={title} accessibilityHint="" accessible>
        {icon(width)}
      </View>
    )
  }

  return (
    <>
      <Button
        label={title}
        hitSlop={hitSlop}
        onPress={evt => {
          evt.preventDefault()
          control.open()
        }}>
        {({ hovered }) => (
          <View
            style={[
              a.transition_transform,
              { transform: [{ scale: hovered ? 1.1 : 1 }] },
            ]}>
            {icon(width)}
          </View>
        )}
      </Button>
      <Dialog.Outer control={control} nativeOptions={{ preventExpansion: true }}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={title} style={[web({ maxWidth: 320 })]}>
          <View style={[a.align_center, a.pb_md]}>{icon(48)}</View>
          <Text emoji style={[a.text_center, a.text_md, a.pb_xl]}>
            {description}
          </Text>
          <View style={[a.gap_sm]}>
            <Button
              label={l`Okay`}
              onPress={() => control.close()}
              color="primary"
              size="large">
              <ButtonText>
                <Trans>Okay</Trans>
              </ButtonText>
            </Button>
            {showSettings && (
              <Button
                label={l`Open settings`}
                onPress={() =>
                  control.close(() => {
                    navigation.navigate('DeltasBadgeSettingsScreen')
                  })
                }
                color="secondary"
                size="large">
                <ButtonText>
                  <Trans>Open settings</Trans>
                </ButtonText>
              </Button>
            )}
          </View>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {Image} from 'expo-image'
import {type PathProps, type SvgProps} from 'react-native-svg'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import type * as bsky from '#/types/bsky'
import {SpecialAccountAlert} from './SpecialAccountAlert'

const ICONS_FOR_ACCOUNT = {
  'did:plc:vshnclkqqguyg6xcz6q7g65k': require('#/../assets/badges/toby.png'),
}

function SpecialIcon({
  source,
  ...rest
}: {source: any; fill?: PathProps['fill']} & SvgProps) {
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 24)

  return (
    <Image
      source={source}
      accessibilityLabel=""
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{width: size, height: size}}
    />
  )
}

export function isSpecialAccount(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): boolean {
  return Object.hasOwn(ICONS_FOR_ACCOUNT, profile.did)
}

export function SpecialBadge({
  profile,
  alwaysShow = false,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  alwaysShow?: boolean
  width: number
}) {
  const t = useTheme()
  const source = ICONS_FOR_ACCOUNT[profile.did as keyof typeof ICONS_FOR_ACCOUNT]

  if (!source && !alwaysShow) {
    return null
  }
  if (!source) {
    return null
  }

  return (
    <View>
      <SpecialIcon
        source={source}
        width={width}
        fill={t.atoms.text_contrast_medium.color}
      />
    </View>
  )
}

export function SpecialBadgeButton({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = useDialogControl()
  const source = ICONS_FOR_ACCOUNT[profile.did as keyof typeof ICONS_FOR_ACCOUNT]

  if (!source) {
    return null
  }

  return (
    <>
      <Button
        label={l`Toby`}
        hitSlop={20}
        onPress={evt => {
          evt.preventDefault()
          control.open()
        }}>
        {({hovered}) => (
          <View
            style={[
              a.justify_end,
              a.align_end,
              a.transition_transform,
              {
                width,
                height: width,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <SpecialIcon
              source={source}
              width={width}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>
        )}
      </Button>
      <SpecialAccountAlert control={control} profile={profile} />
    </>
  )
}

import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import type * as bsky from '#/types/bsky'
import {LightnerIcon} from '../Icons'
import {LightnerAccountAlert} from './LightnerAccountAlert'

export function isLightnerAccount(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): boolean {
  return (
    profile.labels?.some(l => l.val === 'lightner' && l.src === profile.did) ??
    false
  )
}

export function LightnerBadge({
  profile,
  alwaysShow = false,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  alwaysShow?: boolean
  width: number
}) {
  const t = useTheme()

  if (!isLightnerAccount(profile) && !alwaysShow) {
    return null
  }

  return (
    <View>
      <LightnerIcon width={width} fill={t.atoms.text_contrast_medium.color} />
    </View>
  )
}

export function LightnerBadgeButton({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = useDialogControl()

  if (!isLightnerAccount(profile)) {
    return null
  }

  return (
    <>
      <Button
        label={l`Lightner`}
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
            <LightnerIcon
              width={width}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>
        )}
      </Button>
      <LightnerAccountAlert control={control} profile={profile} />
    </>
  )
}

import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import type * as bsky from '#/types/bsky'
import {TennaIcon} from '../Icons'
import { TennaAccountAlert } from './TennaAccountAlert'

export function isTennaAccount(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): boolean {
  return (
    profile.labels?.some(l => l.val === 'tenna' && l.src === profile.did) ??
    false
  )
}

export function TennaBadge({
  profile,
  alwaysShow = false,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  alwaysShow?: boolean
  width: number
}) {
  const t = useTheme()

  if (!isTennaAccount(profile) && !alwaysShow) {
    return null
  }

  return (
    <View>
      <TennaIcon width={width} fill={t.atoms.text_contrast_medium.color} />
    </View>
  )
}

export function TennaBadgeButton({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = useDialogControl()

  if (!isTennaAccount(profile)) {
    return null
  }

  return (
    <>
      <Button
        label={l`Darkner`}
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
            <TennaIcon
              width={width}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>
        )}
      </Button>
      <TennaAccountAlert control={control} profile={profile} />
    </>
  )
}

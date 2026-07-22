import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import type * as bsky from '#/types/bsky'
import {TennaIcon} from '../Icons'
import { TennaAccountAlert } from './TennaAccountAlert'

export const deltaCharNames: {[char: string]: string} = {
  kris: "Kris",
  susie: "Susie",
  ralsei: "Ralsei",
  noelle: "Noelle"
};

export const deltaCharIcons: {[char: string]: any} = {
  "toby": require('#/../assets/badges/toby.png'),
  "kris": require('#/../assets/badges/kris.png'),
  "susie": require('#/../assets/badges/susie.png'),
  "ralsei": require('#/../assets/badges/ralsei.png'),
  "noelle": require('#/../assets/badges/noelle.png')
}

const TOBY_ICON = require('#/../assets/badges/toby.png');

export function isDeltaLabel(val: string): {char: string, kin?: "fictive" | "fictionkin"} {
  if (!val.startsWith("dr-")) return {
    char: "67"
  };
  // dr-kris-fictionkin
  const [chrN, chrT] = val.replace(/^dr\-([a-z]+)-(s|fictive|fictionkin)$/,"$1 $2").split(" ")
  const isKin = chrT !== "s";
  return {
    char: chrN,
    kin: isKin ? (chrT === "fictive" ? "fictive" : "fictionkin") : undefined
  }
}

export function isTennaAccount(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): boolean {
  return (
    profile.labels?.some(l => l.src === profile.did && isDeltaLabel(l.val).char!=="67") ??
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

  const l = profile.labels!.find(l => l.src === profile.did && isDeltaLabel(l.val).char!=="67")!;
  const ll = isDeltaLabel(l.val)

  return (
    <View>
      <TennaIcon width={width} source={deltaCharIcons[ll.char] ?? TOBY_ICON} fill={t.atoms.text_contrast_medium.color} />
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

  const lz = profile.labels!.find(l => l.src === profile.did && isDeltaLabel(l.val).char!=="67")!;
  const ll = isDeltaLabel(lz.val)

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
              source={deltaCharIcons[ll.char] ?? TOBY_ICON}
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

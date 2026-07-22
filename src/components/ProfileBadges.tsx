import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {type Shadow} from '#/state/cache/types'
import {
  usePdsLabelEnabled,
  usePdsLabelHideBskyPds,
} from '#/state/preferences/pds-label'
import {usePdsFaviconQuery, usePdsLabelQuery} from '#/state/queries/pds-label'
import {useDeerVerificationProfileOverlay} from '#/state/queries/deer-verification'
import {atoms as a, useAlf, type ViewStyleProp} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {BotBadge, BotBadgeButton, isBotAccount} from '#/components/BotBadge'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PdsBadgeIcon, PdsDialog} from '#/components/PdsDialog'
import {isPetAccount, PetBadge, PetBadgeButton} from '#/components/PetBadge'
import {
  SpecialBadge,
  SpecialBadgeButton,
  isSpecialAccount,
} from '#/components/CrackComponents/Tenna/SpecialBadge'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import {IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'
import { TennaBadge, TennaBadgeButton } from './CrackComponents/Tenna/TennaBadge'

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const verificationIconSizes: Record<Size, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
} as const

const botIconSizes: Record<Size, number> = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 19,
  xl: 23,
} as const

type ProfileBadgesProps = ViewStyleProp & {
  profile: bsky.profile.AnyProfileView
  interactive?: boolean
  pdsInteractive?: boolean
  size: Size
  allowFontScaling?: boolean
}

export function ProfileBadges(props: ProfileBadgesProps) {
  const profile = useProfileShadow(props.profile)
  return <ProfileBadgesFromProfileShadow {...props} profile={profile} />
}

/**
 * Use when the parent already owns a profile-shadow subscription. Feed rows
 * use this path to avoid subscribing twice for the same author.
 */
export function ProfileBadgesFromProfileShadow({
  profile,
  interactive = false,
  pdsInteractive = true,
  size,
  style,
  allowFontScaling = true,
}: Omit<ProfileBadgesProps, 'profile'> & {
  profile: Shadow<bsky.profile.AnyProfileView>
}) {
  const shadowed = useDeerVerificationProfileOverlay(profile)
  const verification = useSimpleVerificationState({profile: shadowed})
  const pdsLabelEnabled = usePdsLabelEnabled()
  const hideBskyPds = usePdsLabelHideBskyPds()
  const isBskyHandle =
    !!shadowed.handle &&
    shadowed.handle.endsWith('.bsky.social')
  const shouldResolvePds =
    pdsLabelEnabled && !(hideBskyPds && isBskyHandle)
  const {data: pdsData, isLoading: isPdsLoading} = usePdsLabelQuery(
    shouldResolvePds ? shadowed.did : undefined,
  )
  const {data: pdsFaviconUrl} = usePdsFaviconQuery(
    pdsData && !pdsData.isBsky && !pdsData.isBridged
      ? pdsData.pdsUrl
      : undefined,
  )
  const nativeScaleMultiplier = useNativeFontScale()
  const {
    fonts: {scaleMultiplier: alfScaleMultiplier},
  } = useAlf()

  const showPdsBadge =
    shouldResolvePds &&
    (isPdsLoading || (!!pdsData && !(hideBskyPds && pdsData.isBsky)))

  // if nothing to show, don't render the container at all
  if (
    !showPdsBadge &&
    !verification.showBadge &&
    !isBotAccount(shadowed) &&
    !isPetAccount(shadowed) &&
    !shadowed.labels?.some(
      l =>
        (l.val === 'lightner' || l.val === 'darkner') && l.src === shadowed.did,
    ) &&
    !isSpecialAccount(shadowed)
  )
    return null

  const isOnTheSmallSide = size === 'xs' || size === 'sm'

  const scaleMultiplier = allowFontScaling
    ? nativeScaleMultiplier * alfScaleMultiplier
    : 1

  const verificationIconWidth = verificationIconSizes[size] * scaleMultiplier
  const botIconWidth = botIconSizes[size] * scaleMultiplier

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        isOnTheSmallSide ? a.gap_2xs : a.gap_xs,
        style,
      ]}>
      {showPdsBadge && (
        <PdsInlineIcon
          size={size}
          interactive={pdsInteractive}
          isLoading={isPdsLoading}
          isBsky={pdsData?.isBsky ?? isBskyHandle}
          isBridged={pdsData?.isBridged ?? false}
          pdsUrl={pdsData?.pdsUrl}
          faviconUrl={pdsFaviconUrl}
        />
      )}
      {interactive ? (
        <>
          <VerificationCheckButton
            profile={shadowed}
            width={verificationIconWidth}
          />
          <BotBadgeButton profile={shadowed} width={botIconWidth} />
          <PetBadgeButton profile={shadowed} width={botIconWidth} />
          <SpecialBadgeButton profile={shadowed} width={botIconWidth} />
          <TennaBadgeButton profile={shadowed} width={botIconWidth} />
        </>
      ) : (
        <>
          {verification.showBadge && (
            <VerificationCheck
              verifier={verification.role === 'verifier'}
              width={verificationIconWidth}
            />
          )}
          <BotBadge profile={shadowed} width={botIconWidth} />
          <PetBadge profile={shadowed} width={botIconWidth} />
          <SpecialBadge profile={shadowed} width={botIconWidth} />
          <TennaBadge profile={shadowed} width={botIconWidth} />
        </>
      )}
    </View>
  )
}

function pdsIconDimensions(size: Size) {
  switch (size) {
    case 'md':
      return 14
    case 'lg':
      return 20
    case 'xl':
      return 24
    default:
      return 12
  }
}

function PdsInlineIcon({
  size,
  interactive,
  isLoading,
  isBsky,
  isBridged,
  pdsUrl,
  faviconUrl,
}: {
  size: Size
  interactive: boolean
  isLoading: boolean
  isBsky: boolean
  isBridged: boolean
  pdsUrl?: string
  faviconUrl?: string
}) {
  const {t: l} = useLingui()
  const dialogControl = Dialog.useDialogControl()
  const [loadDescription, setLoadDescription] = useState(false)
  const dimensions = pdsIconDimensions(size)

  const icon = (
    <PdsBadgeIcon
      faviconUrl={faviconUrl}
      pdsUrl={pdsUrl}
      isBsky={isBsky}
      isBridged={isBridged}
      size={dimensions}
      borderRadius={Math.round(dimensions * 0.25)}
    />
  )

  if (isLoading || !pdsUrl || !interactive) {
    return (
      <View
        style={[
          a.justify_center,
          a.align_center,
          {width: dimensions, height: dimensions},
        ]}>
        {icon}
      </View>
    )
  }

  return (
    <>
      <Button
        label={l`View PDS information`}
        hitSlop={20}
        onPress={evt => {
          evt.preventDefault()
          setLoadDescription(true)
          dialogControl.open()
          if (IS_WEB) {
            ;(document.activeElement as HTMLElement | null)?.blur()
          }
        }}>
        {({hovered}) => (
          <View style={{width: dimensions, height: dimensions}}>
            <View
              style={[
                a.justify_center,
                a.align_center,
                a.transition_transform,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: [{scale: hovered ? 1.1 : 1}],
                },
              ]}>
              {icon}
            </View>
          </View>
        )}
      </Button>

      <PdsDialog
        control={dialogControl}
        pdsUrl={pdsUrl}
        faviconUrl={faviconUrl}
        loadDescription={loadDescription}
      />
    </>
  )
}

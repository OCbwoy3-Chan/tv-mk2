import {type Insets, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type Shadow} from '#/state/cache/types'
import {useDeerVerification} from '#/state/preferences/deer-verification'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useFullVerificationState} from '#/components/verification'
import {type FullVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationsDialog} from '#/components/verification/VerificationsDialog'
import {VerifierDialog} from '#/components/verification/VerifierDialog'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'
import {type VerificationBadge, verificationBadges} from './badges'
import {verifierColor} from './verifier-color'

export function shouldShowVerificationCheckButton(
  state: FullVerificationState,
) {
  let ok = false

  if (state.profile.role === 'default') {
    if (state.profile.isVerified) {
      ok = true
    } else if (state.profile.isViewer && state.profile.wasVerified) {
      ok = true
    } else if (
      state.viewer.role === 'verifier' &&
      state.viewer.hasIssuedVerification
    ) {
      ok = true
    }
  } else if (state.profile.role === 'verifier') {
    if (state.profile.isViewer) {
      ok = true
    } else if (state.profile.isVerified) {
      ok = true
    }
  }

  if (
    !state.profile.showBadge &&
    !state.profile.isViewer &&
    !(state.viewer.role === 'verifier' && state.viewer.hasIssuedVerification)
  ) {
    ok = false
  }

  return ok
}

export function VerificationCheckButton({
  profile,
  width,
  hitSlop,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  width: number
  hitSlop: Insets
}) {
  const state = useFullVerificationState({
    profile,
  })

  const {perVerifierBadges} = useDeerVerification()
  if (!shouldShowVerificationCheckButton(state)) return null
  const badges = state.profile.showBadge
    ? verificationBadges(profile, !!perVerifierBadges)
    : []
  // Keep the existing access to invalid/hidden verifications for their owner.
  if (!badges.length) badges.push({kind: 'verification'})
  return (
    <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
      {badges.map((badge, index) => (
        <Badge
          key={
            badge.kind === 'verifier'
              ? 'verifier'
              : (badge.issuer ?? 'verification')
          }
          badge={badge}
          profile={profile}
          verificationState={state}
          width={width}
          hitSlop={{
            ...hitSlop,
            left: index === 0 ? hitSlop.left : 1,
            right: index === badges.length - 1 ? hitSlop.right : 1,
          }}
        />
      ))}
    </View>
  )
}

function Badge({
  badge,
  profile,
  verificationState: state,
  width,
  hitSlop,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  badge: VerificationBadge
  verificationState: FullVerificationState
  width: number
  hitSlop: Insets
}) {
  const t = useTheme()
  const {perVerifierBadges} = useDeerVerification()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const verificationsDialogControl = useDialogControl()
  const verifierDialogControl = useDialogControl()

  const isVerifier = badge.kind === 'verifier'
  const issuer = badge.kind === 'verification' ? badge.issuer : undefined
  const verifiedByHidden = !state.profile.showBadge && state.profile.isViewer

  return (
    <>
      <Button
        label={
          isVerifier
            ? l`View trusted verifier status`
            : issuer
              ? l`View verification from ${issuer}`
              : state.profile.isViewer
                ? l`View your verifications`
                : l`View this user's verifications`
        }
        hitSlop={hitSlop}
        onPress={evt => {
          evt.preventDefault()
          ax.metric('verification:badge:click', {})
          if (isVerifier) {
            verifierDialogControl.open()
          } else {
            verificationsDialogControl.open()
          }
        }}>
        {({hovered}) => (
          <View
            style={[
              a.justify_end,
              a.align_end,
              a.transition_transform,
              {
                width: width,
                height: width,
                transform: [
                  {
                    scale: hovered ? 1.1 : 1,
                  },
                ],
              },
            ]}>
            <VerificationCheck
              width={width}
              fill={
                isVerifier
                  ? perVerifierBadges
                    ? verifierColor(badge.did, t)
                    : t.palette.primary_500
                  : verifiedByHidden
                    ? t.atoms.bg_contrast_100.backgroundColor
                    : state.profile.isVerified
                      ? perVerifierBadges
                        ? verifierColor(issuer ?? profile.did, t)
                        : t.palette.primary_500
                      : t.atoms.bg_contrast_100.backgroundColor
              }
              verifier={isVerifier}
            />
          </View>
        )}
      </Button>
      {isVerifier ? (
        <VerifierDialog
          control={verifierDialogControl}
          profile={profile}
          verificationState={state}
        />
      ) : (
        <VerificationsDialog
          issuer={issuer}
          control={verificationsDialogControl}
          profile={profile}
          verificationState={state}
        />
      )}
    </>
  )
}

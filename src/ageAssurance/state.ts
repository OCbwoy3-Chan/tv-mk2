import {useEffect, useMemo, useState} from 'react'
import {type AppBskyAgeassuranceDefs} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {useSession} from '#/state/session'
import {
  getConfigFromCache,
  getOtherRequiredDataFromCache,
  getServerStateFromCache,
  useAgeAssuranceServerDataContext,
} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  AgeAssuranceAccess,
  type AgeAssuranceFlags,
  type AgeAssuranceMetadata,
  type AgeAssuranceState,
  AgeAssuranceStatus,
} from '#/ageAssurance/types'
import {type Geolocation, useGeolocation} from '#/geolocation'
import {device} from '#/storage'

const PERMISSIVE_FLAGS: AgeAssuranceFlags = {
  adultContentDisabled: false,
  chatDisabled: false,
  isDeclaredUnderAdultAge: false,
  isOverRegionMinAccessAge: true,
  isOverAppMinAccessAge: true,
}

/**
 * Get final evaluated age assurance state.
 *
 * We intentionally keep this permissive (matching the older behavior) and
 * allow full access for logged-in users.
 */
function computeAgeAssuranceState({
  hasSession,
}: {
  hasSession: boolean
  geolocation: Geolocation
  config?: AppBskyAgeassuranceDefs.Config
  state?: AppBskyAgeassuranceDefs.State
  metadata?: AgeAssuranceMetadata
}) {
  if (!hasSession)
    return {
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Safe,
    }
  // Don't baby the user. They know what they're doing. Age assurance is not
  // mandatory in many regions, and there is no need to pander to bureaucrats
  // when making FOSS software. You're free not to use this software if the
  // notion of letting the user choose their moderation settings freely,
  // without giving up their personal data to anyone, offends you.
  return {
    lastInitiatedAt: undefined,
    status: AgeAssuranceStatus.Unknown,
    access: AgeAssuranceAccess.Full,
  }
}

/**
 * This is a last-ditch helper for out-of-band reads of the AA state, such as
 * during account creation. Don't use it for anything else.
 */
export function unsafeGetAndComputeAgeAssurance({did}: {did: string}) {
  const config = getConfigFromCache()
  const state = getServerStateFromCache({did})
  const requiredData = getOtherRequiredDataFromCache({did})
  const geolocation =
    device.get(['mergedGeolocation']) ||
    ({countryCode: undefined, regionCode: undefined} as Geolocation)

  const metadata: AgeAssuranceMetadata = {
    accountCreatedAt: state?.metadata?.accountCreatedAt,
    declaredAge: requiredData?.birthdate
      ? getAge(new Date(requiredData.birthdate))
      : undefined,
    birthdate: requiredData?.birthdate,
  }
  const computed = computeAgeAssuranceState({
    hasSession: true,
    config,
    geolocation,
    state: state?.state,
    metadata,
  })

  return {
    state: computed,
    flags: PERMISSIVE_FLAGS,
  }
}

export function useAgeAssuranceState(): AgeAssuranceState {
  const {hasSession} = useSession()
  const geolocation = useGeolocation()
  const {config, state, metadata} = useAgeAssuranceServerDataContext()

  return useMemo(
    () =>
      computeAgeAssuranceState({
        hasSession,
        config,
        geolocation,
        state,
        metadata,
      }),
    [hasSession, geolocation, config, state, metadata],
  )
}

export function useOnAgeAssuranceAccessUpdate(
  cb: (state: AgeAssuranceState) => void,
) {
  const state = useAgeAssuranceState()
  // start with null to ensure callback is called on first render
  const [prevAccess, setPrevAccess] = useState<AgeAssuranceAccess | null>(null)

  useEffect(() => {
    if (prevAccess !== state.access) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevAccess(state.access)
      cb(state)
      logger.debug(`useOnAgeAssuranceAccessUpdate`, {state})
    }
  }, [cb, state, prevAccess])
}

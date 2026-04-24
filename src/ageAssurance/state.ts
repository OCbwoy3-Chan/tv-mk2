import {useEffect, useMemo, useState} from 'react'

import {getAge} from '#/lib/strings/time'
import {useSession} from '#/state/session'
import {
  type AgeAssuranceData,
  getConfigFromCache,
  getOtherRequiredDataFromCache,
  getServerStateFromCache,
  useAgeAssuranceDataContext,
} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  AgeAssuranceAccess,
  type AgeAssuranceState,
  AgeAssuranceStatus,
} from '#/ageAssurance/types'
import {type Geolocation, useGeolocation} from '#/geolocation'
import {device} from '#/storage'

/**
 * Get final evaluated age assurance state.
 *
 * We intentionally keep this permissive (matching the older behavior) and
 * allow full access for logged-in users.
 */
export function computeAgeAssuranceState({
  hasSession,
}: {
  hasSession: boolean
  config: AgeAssuranceData['config']
  geolocation: Geolocation
  state: AgeAssuranceData['state']
  data: AgeAssuranceData['data']
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
  const computed = {
    lastInitiatedAt: undefined,
    status: AgeAssuranceStatus.Unknown,
    access: AgeAssuranceAccess.Full,
  }
  return computed
}

/**
 * This is a last-ditch helper for out-of-band reads of the AA state, such as
 * during account creation. Don't use it for anything else.
 */
export function getAndComputeAgeAssuranceState({did}: {did: string}) {
  const config = getConfigFromCache()
  const state = getServerStateFromCache({did})
  const data = getOtherRequiredDataFromCache({did})
  const geolocation =
    device.get(['mergedGeolocation']) ||
    ({countryCode: undefined, regionCode: undefined} as Geolocation)

  return computeAgeAssuranceState({
    hasSession: true,
    config,
    geolocation,
    state: state?.state,
    data: {
      accountCreatedAt: state?.metadata?.accountCreatedAt,
      declaredAge: data?.birthdate
        ? getAge(new Date(data.birthdate))
        : undefined,
      birthdate: data?.birthdate,
    },
  })
}

export function useAgeAssuranceState(): AgeAssuranceState {
  const {hasSession} = useSession()
  const geolocation = useGeolocation()
  const {config, state, data} = useAgeAssuranceDataContext()

  return useMemo(
    () =>
      computeAgeAssuranceState({
        hasSession,
        config,
        geolocation,
        state,
        data,
      }),
    [hasSession, geolocation, config, state, data],
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

import {useEffect, useMemo, useState} from 'react'

import {useSession} from '#/state/session'
import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  AgeAssuranceAccess,
  type AgeAssuranceState,
  AgeAssuranceStatus,
} from '#/ageAssurance/types'
import {useGeolocation} from '#/geolocation'

export function useAgeAssuranceState(): AgeAssuranceState {
  const {hasSession} = useSession()
  const geolocation = useGeolocation()
  const {config, state, data} = useAgeAssuranceDataContext()

  return useMemo(() => {
    /**
     * This is where we control logged-out moderation prefs. It's all
     * downstream of AA now.
     */
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
  }, [hasSession, geolocation, config, state, data])
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

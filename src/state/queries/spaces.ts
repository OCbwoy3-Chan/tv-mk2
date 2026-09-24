import {useEffect, useState} from 'react'

import {isSpacesCompatiblePDS} from '#/lib/spaces'
import {useAgent, useSession} from '#/state/session'

/** Returns true when the current account's PDS successfully lists its spaces. */
export function useSpacesCompatiblePDS(enabled: boolean) {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const [compatible, setCompatible] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    if (!enabled || !currentAccount) {
      setCompatible(undefined)
      return () => {
        cancelled = true
      }
    }

    setCompatible(undefined)
    void isSpacesCompatiblePDS(agent).then(result => {
      if (!cancelled) {
        setCompatible(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [agent, currentAccount, enabled])

  return compatible
}

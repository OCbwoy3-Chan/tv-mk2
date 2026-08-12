import {useCallback, useEffect, useSyncExternalStore} from 'react'

import {type PdsProfilePriority} from '#/state/pds-viewability'
import {useFaviconService} from '#/state/preferences/favicon-service'
import {
  getFaviconServiceUrl,
  getPdsFallbackFaviconUrl,
  isBridgedPdsUrl,
  isBskyPdsUrl,
} from '#/state/queries/pds-label.util'
import {
  getPdsLabelSnapshot,
  requestPdsLabel,
  subscribePdsLabel,
} from '#/state/queries/pds-label-resolver'

export {getPdsFallbackFaviconUrl, isBridgedPdsUrl, isBskyPdsUrl}

export function usePdsLabelQuery(
  did: string | undefined,
  priority: PdsProfilePriority,
) {
  const enabled = !!did && priority !== 'off'
  const subscribe = useCallback(
    (listener: () => void) =>
      did ? subscribePdsLabel(did, listener) : () => {},
    [did],
  )
  const getSnapshot = useCallback(
    () => (did ? getPdsLabelSnapshot(did) : getPdsLabelSnapshot('')),
    [did],
  )
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    if (enabled) {
      requestPdsLabel(
        did as `did:${string}:${string}`,
        priority === 'visible' ? 'visible' : 'near',
      )
    }
  }, [did, enabled, priority])

  return snapshot
}

export function usePdsFaviconUrl(pdsUrl: string | undefined) {
  const faviconService = useFaviconService()
  return pdsUrl && faviconService
    ? getFaviconServiceUrl(pdsUrl, faviconService)
    : undefined
}

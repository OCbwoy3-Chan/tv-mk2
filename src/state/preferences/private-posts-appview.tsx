import {useCallback, useEffect, useState} from 'react'

import {
  DEFAULT_PRIVATE_POSTS_APPVIEW_DID,
  resolveAtprotoSpaceServiceEndpoint,
} from '#/lib/atproto/space-service'
import {device, useStorage} from '#/storage'

export function usePrivatePostsAppViewDID() {
  const [did, setDid] = useStorage(device, ['privatePostsAppViewDID'])
  return [did ?? DEFAULT_PRIVATE_POSTS_APPVIEW_DID, setDid] as const
}

export function useSetPrivatePostsAppViewDID() {
  const [, setDid] = usePrivatePostsAppViewDID()

  return useCallback((did: string | undefined) => setDid(did), [setDid])
}

/** Resolves the selected DID's #private AtprotoSpaceService endpoint. */
export function usePrivatePostsAppViewURL() {
  const [did] = usePrivatePostsAppViewDID()
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    const controller = new AbortController()
    setUrl(undefined)

    void resolveAtprotoSpaceServiceEndpoint(did, controller.signal)
      .then(setUrl)
      .catch(() => {
        if (!controller.signal.aborted) setUrl(undefined)
      })

    return () => controller.abort()
  }, [did])

  return url
}

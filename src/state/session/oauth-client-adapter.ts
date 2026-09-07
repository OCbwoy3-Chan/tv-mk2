import {type OAuthSession} from '@atproto/oauth-client-browser'

import {getWebOAuthClient} from './oauth-web-client'

let restoreChain: Promise<unknown> = Promise.resolve()

export function createOAuthTransport(session: OAuthSession) {
  return {
    did: session.did,
    async fetchHandler(...args: Parameters<OAuthSession['fetchHandler']>) {
      // Another tab's authorization replaces both tokens and the DPoP key.
      // A retained OAuthSession reads the new tokens but signs with its old
      // key; its attempted refresh can then invalidate the shared session.
      const current = await restoreOAuthSession(session.did, false)
      return current.fetchHandler(...args)
    },
  }
}

export function restoreOAuthSession(
  did: string,
  refresh: boolean | 'auto' = 'auto',
): Promise<OAuthSession> {
  const result = restoreChain.then(() =>
    getWebOAuthClient().restore(did, refresh === 'auto' ? undefined : refresh),
  )
  restoreChain = result.catch(() => {})
  return result
}

import {type OAuthSession} from '@atproto/oauth-client-browser'

import {getWebOAuthClient} from './oauth-web-client'

let restoreChain: Promise<unknown> = Promise.resolve()

export function restoreOAuthSession(
  did: string,
  refresh: boolean | 'auto' = 'auto',
): Promise<OAuthSession> {
  const result = restoreChain.then(() =>
    getWebOAuthClient().restore(did, refresh),
  )
  restoreChain = result.catch(() => {})
  return result
}

import {type OAuthSession} from '@atproto/oauth-client-expo'

import {getNativeOAuthClient} from './oauth-native-client'

export function restoreOAuthSession(
  did: string,
  _refresh: boolean | 'auto' = 'auto',
): Promise<OAuthSession> {
  return getNativeOAuthClient().restore(did)
}

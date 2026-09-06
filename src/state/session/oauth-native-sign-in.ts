import {type OAuthSession} from '@atproto/oauth-client-expo'

import {getNativeOAuthClient} from './oauth-native-client'
import {getOAuthScope} from './oauth-scopes'

/** iOS uses ASWebAuthenticationSession through the package's native helper. */
export function signInNative(
  identifier: string,
  {scope = getOAuthScope()}: {signal?: AbortSignal; scope?: string} = {},
): Promise<OAuthSession> {
  return getNativeOAuthClient().signIn(identifier, {scope})
}

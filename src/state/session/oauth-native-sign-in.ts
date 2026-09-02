import {type OAuthSession} from '@atproto/oauth-client-expo'

import {getNativeOAuthClient} from './oauth-native-client'

/** iOS uses ASWebAuthenticationSession through the package's native helper. */
export function signInNative(
  identifier: string,
  _options: {signal?: AbortSignal} = {},
): Promise<OAuthSession> {
  return getNativeOAuthClient().signIn(identifier)
}

import {type OAuthSession} from '@atproto/oauth-client-expo'

import {getNativeOAuthClient} from './oauth-native-client'
import {getOAuthScope} from './oauth-scopes'

type SignInOptions = {
  signal?: AbortSignal
  scope?: string
  audiences?: {appview: string; chat: string}
}

/** iOS uses ASWebAuthenticationSession through the package's native helper. */
export function signInNative(
  identifier: string,
  {scope = getOAuthScope(), audiences}: SignInOptions = {},
): Promise<OAuthSession> {
  return getNativeOAuthClient(audiences).signIn(identifier, {scope})
}

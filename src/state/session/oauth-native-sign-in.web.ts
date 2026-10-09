import {type OAuthSession} from '@atproto/oauth-client-browser'

import {getWebOAuthClient} from './oauth-web-client'
import {getOAuthScope} from './oauth-scopes'

type SignInOptions = {
  scope?: string
  audiences?: {appview: string; chat: string}
}

export function signInNative(
  identifier: string,
  {scope = getOAuthScope(), audiences}: SignInOptions = {},
): Promise<OAuthSession> {
  return getWebOAuthClient(audiences).signIn(identifier, {scope})
}

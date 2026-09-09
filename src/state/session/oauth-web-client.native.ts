import {type OAuthSession} from '@atproto/oauth-client-expo'

/**
 * Web-only OAuth client. Native builds use oauth-native-client instead.
 * This stub prevents Metro from bundling @atproto/oauth-client-browser
 * (and its jose/node:crypto dependency chain) into native apps.
 */
type WebOAuthClientStub = {
  initCallback: (
    params: URLSearchParams,
  ) => Promise<{session: OAuthSession; state?: string}>
  restore: (did: string, refresh?: boolean) => Promise<never>
  signIn: (input: string, options?: unknown) => Promise<OAuthSession>
}

export function getWebOAuthClient(_audiences?: {
  appview: string
  chat: string
}): WebOAuthClientStub {
  throw new Error('getWebOAuthClient is only available on web')
}

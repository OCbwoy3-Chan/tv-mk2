/**
 * Web-only OAuth client. Native builds use oauth-native-client instead.
 * This stub prevents Metro from bundling @atproto/oauth-client-browser
 * (and its jose/node:crypto dependency chain) into native apps.
 */
type WebOAuthClientStub = {
  init: () => Promise<{session: never} | undefined>
  restore: (did: string, refresh?: boolean) => Promise<never>
  signIn: (input: string, options?: unknown) => Promise<never>
}

export function getWebOAuthClient(): WebOAuthClientStub {
  throw new Error('getWebOAuthClient is only available on web')
}

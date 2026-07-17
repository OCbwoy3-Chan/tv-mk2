/**
 * Web-only OAuth client. Native builds use oauth-native-client instead.
 * This stub prevents Metro from bundling @atproto/oauth-client-browser
 * (and its jose/node:crypto dependency chain) into native apps.
 */
export function getWebOAuthClient(): never {
  throw new Error('getWebOAuthClient is only available on web')
}
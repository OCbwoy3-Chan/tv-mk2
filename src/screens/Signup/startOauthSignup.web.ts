import {getWebOAuthClient} from '#/state/session/oauth-web-client'
import {saveOAuthReturnUrl} from '#/state/session/oauth-web-return-url'

/**
 * Starts an OAuth authorization flow with `prompt: create` against the given
 * PDS so the user can create an account on that provider's account UI.
 *
 * Redirects the browser to the authorization server.
 */
export function useStartOauthSignup() {
  return async (serviceUrl: string) => {
    saveOAuthReturnUrl()
    const client = getWebOAuthClient()
    await client.signIn(serviceUrl, {prompt: 'create'})
  }
}

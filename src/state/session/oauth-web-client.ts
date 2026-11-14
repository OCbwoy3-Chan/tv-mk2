import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

import {createIdentityResolver} from './identity-resolver'
import {createOAuthMetadata} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'

const clients = new Map<string, BrowserOAuthClient>()

export function getWebOAuthClient(
  audiences: {appview: string; chat: string} = getOAuthAudiences(),
) {
  const metadata = createOAuthMetadata({
    baseUrl: process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://tenna.party',
    clientName: process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'tenna.party',
    ...audiences,
  })
  if (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(
      window.location.hostname,
    )
  ) {
    const port = window.location.port ? `:${window.location.port}` : ''
    const redirectUri = `http://127.0.0.1${port}/`
    metadata.client_id = `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(metadata.scope)}`
    metadata.redirect_uris = [redirectUri]
  }
  let client = clients.get(metadata.client_id)
  if (!client) {
    client = new BrowserOAuthClient({
      clientMetadata: metadata,
      identityResolver: createIdentityResolver(),
    })
    clients.set(metadata.client_id, client)
  }
  return client
}

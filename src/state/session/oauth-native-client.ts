import {ExpoOAuthClient} from '@atproto/oauth-client-expo'

import {createIdentityResolver} from './identity-resolver'
import {createOAuthMetadata} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'

export {NATIVE_REDIRECT_URI} from './oauth-config'
const clients = new Map<string, ExpoOAuthClient>()

export function getNativeOAuthClient() {
  const metadata = createOAuthMetadata({
    baseUrl: process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://witchsky.app',
    clientName: process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Witchsky',
    native: true,
    ...getOAuthAudiences(),
  })
  let client = clients.get(metadata.client_id)
  if (!client) {
    client = new ExpoOAuthClient({
      clientMetadata: metadata,
      identityResolver: createIdentityResolver(),
    })
    clients.set(metadata.client_id, client)
  }
  return client
}

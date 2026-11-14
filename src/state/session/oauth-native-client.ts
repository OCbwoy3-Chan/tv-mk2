import {ExpoOAuthClient} from '@atproto/oauth-client-expo'

import {IS_IOS} from '#/env'
import {createIdentityResolver} from './identity-resolver'
import {createOAuthMetadata, NATIVE_REDIRECT_URI as LEGACY_REDIRECT_URI} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'

const baseUrl = process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://tenna.party'
const hostname = new URL(baseUrl).hostname
export const NATIVE_REDIRECT_URI =
  hostname === 'tenna.party' || hostname.endsWith('.tenna.party')
    ? `${IS_IOS ? 'party.tenna' : 'app.tennaparty'}:/auth/callback`
    : LEGACY_REDIRECT_URI
const clients = new Map<string, ExpoOAuthClient>()

export function getNativeOAuthClient(
  audiences: {appview: string; chat: string} = getOAuthAudiences(),
) {
  const metadata = createOAuthMetadata({
    baseUrl,
    clientName: process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'tenna.party',
    native: true,
    ...audiences,
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

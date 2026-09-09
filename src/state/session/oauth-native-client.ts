import {ExpoOAuthClient} from '@atproto/oauth-client-expo'

import {IS_IOS} from '#/env'
import {createIdentityResolver} from './identity-resolver'
import {ANDROID_REDIRECT_URI, createOAuthMetadata, NATIVE_REDIRECT_URI as IOS_REDIRECT_URI} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'

export const NATIVE_REDIRECT_URI = IS_IOS ? IOS_REDIRECT_URI : ANDROID_REDIRECT_URI
const clients = new Map<string, ExpoOAuthClient>()

export function getNativeOAuthClient(
  audiences: {appview: string; chat: string} = getOAuthAudiences(),
) {
  const metadata = createOAuthMetadata({
    baseUrl: process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://tenna.party',
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

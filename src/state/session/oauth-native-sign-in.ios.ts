import {openAuthSessionAsync} from 'expo-web-browser'
import {type OAuthSession} from '@atproto/oauth-client-expo'

import {getNativeOAuthClient, NATIVE_REDIRECT_URI} from './oauth-native-client'

/**
 * Run iOS OAuth with the app's Expo SDK version of `expo-web-browser`.
 *
 * The OAuth package currently installs its own older browser helper, which is
 * not the native-module version bundled by this Expo SDK. Keeping browser
 * ownership here avoids crossing those incompatible JS/native versions.
 */
export async function signInNative(
  identifier: string,
  {signal: _signal}: {signal?: AbortSignal} = {},
): Promise<OAuthSession> {
  const client = getNativeOAuthClient()
  const authorizationUrl = await client.authorize(identifier, {
    display: 'touch',
    redirect_uri: NATIVE_REDIRECT_URI,
  })
  const result = await openAuthSessionAsync(
    authorizationUrl.toString(),
    NATIVE_REDIRECT_URI,
    {
      dismissButtonStyle: 'cancel',
      preferEphemeralSession: false,
    },
  )

  if (result.type !== 'success') {
    throw new Error(`Authentication cancelled: ${result.type}`)
  }

  const callbackUrl = new URL(result.url)
  const {session} = await client.callback(callbackUrl.searchParams, {
    redirect_uri: NATIVE_REDIRECT_URI,
  })
  return session
}

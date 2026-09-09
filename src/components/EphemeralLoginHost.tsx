import {useSyncExternalStore} from 'react'
import {View} from 'react-native'

import {
  readEphemeralLogin,
  subscribeEphemeralLogin,
} from '#/state/session/ephemeral-login'
import {signInNative} from '#/state/session/oauth-native-sign-in'
import {getOAuthScope} from '#/state/session/oauth-scopes'
import {getWebOAuthClient} from '#/state/session/oauth-web-client'
import {Login} from '#/screens/Login'
import {EphemeralLoginContext} from '#/screens/Login/EphemeralLoginContext'
import {IS_WEB} from '#/env'
import {EphemeralLoginContainer} from './EphemeralLoginContainer'

export function EphemeralLoginHost() {
  const request = useSyncExternalStore(
    subscribeEphemeralLogin,
    readEphemeralLogin,
    readEphemeralLogin,
  )
  if (!request) return null
  return (
    <EphemeralLoginContainer onClose={request.cancel}>
      <EphemeralLoginContext.Provider
        value={{
          ...request,
          authorize: async identifier => {
            const scope = request.options?.scope ?? getOAuthScope()
            const session = IS_WEB
              ? await getWebOAuthClient().signIn(identifier, {
                  scope,
                  display: 'popup',
                })
              : await signInNative(identifier, {scope})
            await request.submit({
              service: '',
              identifier: '',
              password: '',
              oauthSession: session,
            })
          },
        }}>
        <View style={{flex: 1}}>
          <Login
            onPressBack={request.cancel}
            onPressCreateAccount={request.cancel}
          />
        </View>
      </EphemeralLoginContext.Provider>
    </EphemeralLoginContainer>
  )
}

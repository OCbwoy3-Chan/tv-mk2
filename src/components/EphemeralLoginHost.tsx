import {useSyncExternalStore} from 'react'
import {Modal, View} from 'react-native'

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

export function EphemeralLoginHost() {
  const request = useSyncExternalStore(
    subscribeEphemeralLogin,
    readEphemeralLogin,
    readEphemeralLogin,
  )
  if (!request) return null
  return (
    <Modal visible onRequestClose={request.cancel} presentationStyle="pageSheet">
      <EphemeralLoginContext.Provider
        value={{
          ...request,
          authorize: async identifier => {
            const session = IS_WEB
              ? await getWebOAuthClient().signIn(identifier, {
                  scope: getOAuthScope(),
                  display: 'popup',
                })
              : await signInNative(identifier)
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
    </Modal>
  )
}

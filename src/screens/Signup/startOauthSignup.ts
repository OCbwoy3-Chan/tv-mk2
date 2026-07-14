import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {useSessionApi} from '#/state/session'
import {getNativeOAuthClient} from '#/state/session/oauth-native-client'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'

/**
 * Starts an OAuth authorization flow with `prompt: create` against the given
 * PDS so the user can create an account on that provider's account UI.
 */
export function useStartOauthSignup() {
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut, clearRequestedAccount} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  return async (serviceUrl: string) => {
    const client = getNativeOAuthClient()
    const session = await client.signIn(serviceUrl, {prompt: 'create'})
    await login(
      {
        service: '',
        identifier: '',
        password: '',
        oauthSession: session,
      },
      'LoginForm',
    )
    setShowLoggedOut(false)
    clearRequestedAccount()
    setHasCheckedForStarterPack(true)
    void requestNotificationsPermission('Login')
  }
}

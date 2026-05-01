import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {replaceWebLocation} from '#/lib/routes/web'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {getWebOAuthClient} from '#/state/session/oauth-web-client'
import {
  consumeOAuthReturnUrl,
  saveOAuthCallbackError,
} from '#/state/session/oauth-web-return-url'
import {
  canAttemptSessionResume,
  readLastActiveAccount,
} from '#/state/session/util'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'

export function AuthCallback() {
  const {login, resumeSession} = useSessionApi()
  const navigation = useNavigation<NavigationProp>()
  const {requestSwitchToAccount, setShowLoggedOut} = useLoggedOutViewControls()

  useEffect(() => {
    void (async () => {
      try {
        const client = getWebOAuthClient()
        const result = await client.init()
        if (result?.session) {
          await login(
            {
              service: '',
              identifier: '',
              password: '',
              oauthSession: result.session,
            },
            'LoginForm',
          )
        }

        const returnUrl = consumeOAuthReturnUrl()
        if (returnUrl) {
          replaceWebLocation(returnUrl)
          return
        }

        navigation.replace('Home')
      } catch (e: unknown) {
        const error =
          e instanceof Error ? cleanError(e.message) : cleanError(String(e))
        logger.error('OAuth callback failed', {
          error: e instanceof Error ? e.message : String(e),
        })

        const returnUrl = consumeOAuthReturnUrl()
        const lastAccount = readLastActiveAccount()

        if (lastAccount && canAttemptSessionResume(lastAccount)) {
          try {
            await resumeSession(lastAccount, true)
            setShowLoggedOut(false)
            if (returnUrl) {
              window.history.replaceState(null, '', returnUrl)
            } else {
              navigation.replace('Home')
            }
            return
          } catch (resumeError) {
            logger.error('OAuth callback recovery failed', {
              error:
                resumeError instanceof Error
                  ? resumeError.message
                  : String(resumeError),
            })
          }
        }

        saveOAuthCallbackError(error)
        requestSwitchToAccount({
          requestedAccount: lastAccount?.did ?? 'none',
        })
        if (returnUrl) {
          window.history.replaceState(null, '', returnUrl)
        } else {
          navigation.replace('Home')
        }
      }
    })()
  }, [
    login,
    navigation,
    requestSwitchToAccount,
    resumeSession,
    setShowLoggedOut,
  ])

  return null
}

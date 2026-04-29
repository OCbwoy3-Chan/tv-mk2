import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {replaceWebLocation} from '#/lib/routes/web'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {getWebOAuthClient} from '#/state/session/oauth-web-client'
import {consumeOAuthReturnUrl} from '#/state/session/oauth-web-return-url'

export function AuthCallback() {
  const {login} = useSessionApi()
  const navigation = useNavigation<NavigationProp>()

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
        logger.error('OAuth callback failed', {
          error: e instanceof Error ? e.message : String(e),
        })
        navigation.replace('Home')
      }
    })()
  }, [login, navigation])

  return null
}

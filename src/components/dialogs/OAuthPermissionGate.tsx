import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {useSession, useSessionApi} from '#/state/session'
import {restoreOAuthSession} from '#/state/session/oauth-client-adapter'
import {
  hasOAuthPermission,
  type OAuthPermission,
  OPTIONAL_OAUTH_SCOPES,
} from '#/state/session/oauth-config'
import {getOAuthScope} from '#/state/session/oauth-scopes'
import {atoms as a, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

/** Render inside an opened action dialog, never in a background query. */
export function OAuthPermissionGate({
  permission,
  children,
  standalone = false,
}: {
  permission: OAuthPermission
  children: React.ReactNode
  /** Own the dialog surface when the authorized child supplies its own inner. */
  standalone?: boolean
}) {
  const {currentAccount} = useSession()
  const {reauthenticateAccount, resumeSession} = useSessionApi()
  const {t: l} = useLingui()
  const [grant, setGrant] = useState<{did: string; scope: string}>()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const did = currentAccount?.did
  const isOauth = currentAccount?.isOauthSession
  const granted = grant?.did === did ? grant?.scope : undefined

  useEffect(() => {
    let active = true
    setGrant(undefined)
    setError('')
    if (did && isOauth) {
      void restoreOAuthSession(did)
        .then(session => session.getTokenInfo(false))
        .then(info => {
          if (active) setGrant({did, scope: info.scope})
        })
        .catch(err => {
          if (active) setError(cleanError(err))
        })
    }
    return () => {
      active = false
    }
  }, [did, isOauth])

  if (
    !isOauth ||
    (granted !== undefined && hasOAuthPermission(granted, permission))
  ) {
    return children
  }

  const authorize = async () => {
    if (!currentAccount || !did || pending) return
    setPending(true)
    setError('')
    try {
      // Retain previously approved optional access, never transition scopes.
      const permissions = (
        Object.keys(OPTIONAL_OAUTH_SCOPES) as OAuthPermission[]
      ).filter(
        key =>
          key === permission ||
          (granted !== undefined && hasOAuthPermission(granted, key)),
      )
      const scope = getOAuthScope(permissions)
      const account = await reauthenticateAccount(currentAccount, {
        scope,
        directOAuth: true,
      })
      if (!account.isOauthSession) {
        await resumeSession(account)
        return
      }
      const session = await restoreOAuthSession(account.did)
      const info = await session.getTokenInfo(false)
      if (!hasOAuthPermission(info.scope, permission)) {
        throw new Error(l`The requested permission was not granted.`)
      }
      await resumeSession(account)
      setGrant({did, scope: info.scope})
    } catch (err) {
      setError(cleanError(err))
    } finally {
      setPending(false)
    }
  }

  const prompt = (
    <View style={[a.gap_md]}>
      <Text style={[a.text_xl, a.font_semi_bold]}>
        <Trans>Additional permission required</Trans>
      </Text>
      <Text>
        {permission === 'handle'
          ? l`Allow Witchsky to change your handle to continue.`
          : l`Allow Witchsky to view and verify your email address to continue.`}
      </Text>
      {error ? <Admonition type="error">{error}</Admonition> : null}
      {!granted && !error ? (
        <Loader size="lg" />
      ) : (
        <Button
          label={l`Continue to authorization`}
          onPress={authorize}
          disabled={pending}
          size="large"
          color="primary">
          <ButtonText>
            <Trans>Continue to authorization</Trans>
          </ButtonText>
        </Button>
      )}
    </View>
  )
  if (!standalone) return prompt
  return (
    <>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Additional permission required`}
        style={web({maxWidth: 400})}>
        {prompt}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </>
  )
}

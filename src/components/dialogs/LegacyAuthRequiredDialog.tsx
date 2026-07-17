import {useRef, useState} from 'react'
import {View} from 'react-native'
import {ComAtprotoServerCreateSession} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useSession, useSessionApi} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as TicketIcon} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

/**
 * Shown when an OAuth session cannot perform an action that requires password
 * auth. Submits credentials in-place and replaces the current session on
 * success so the parent dialog can continue.
 */
export function LegacyAuthRequiredDialogContent() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const {login} = useSessionApi()
  const passwordRef = useRef('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)
  const [authFactorToken, setAuthFactorToken] = useState('')

  const onSubmit = async () => {
    if (!currentAccount || isProcessing) return

    const password = passwordRef.current
    if (!password) {
      setError(l`Please enter your password`)
      return
    }

    const service = currentAccount.pdsUrl ?? currentAccount.service
    const identifier = currentAccount.handle
    if (!service || !identifier) {
      setError(l`Unable to sign in with this account. Please try again.`)
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      await login(
        {
          service,
          identifier,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'Settings',
      )
    } catch (err) {
      setIsProcessing(false)
      const errMsg = String(err)
      if (
        err instanceof
        ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setNeeds2fa(true)
        return
      }
      if (errMsg.includes('Token is invalid')) {
        setError(l`Invalid 2FA confirmation code.`)
      } else if (
        errMsg.includes('Authentication Required') ||
        errMsg.includes('Invalid identifier or password')
      ) {
        setError(l`Incorrect password`)
      } else if (isNetworkError(err)) {
        logger.warn('Failed to switch to password session due to network error', {
          error: errMsg,
        })
        setError(
          l`Unable to contact your service. Please check your Internet connection.`,
        )
      } else {
        logger.warn('Failed to switch to password session', {error: errMsg})
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Password sign-in required`}
        style={web({maxWidth: 400})}>
        <View style={[a.gap_md]}>
          <Text
            style={[
              a.text_xl,
              a.font_semi_bold,
              a.leading_snug,
              {paddingRight: 32},
            ]}>
            <Trans>Password sign-in required</Trans>
          </Text>
          <Text
            style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              You're signed in with OAuth. Enter your password to continue with
              this action.
            </Trans>
          </Text>

          {error ? <Admonition type="error">{error}</Admonition> : null}

          <View>
            <TextField.LabelText>
              <Trans>Password</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={!!error && !needs2fa}>
              <TextField.Icon icon={LockIcon} />
              <Dialog.Input
                testID="legacyAuthPasswordInput"
                label={l`Password`}
                placeholder={null}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                returnKeyType={needs2fa ? 'next' : 'done'}
                secureTextEntry
                editable={!isProcessing}
                onChangeText={value => {
                  passwordRef.current = value
                  if (error) setError('')
                }}
                onSubmitEditing={() => {
                  if (!needs2fa) {
                    void onSubmit()
                  }
                }}
              />
            </TextField.Root>
          </View>

          {needs2fa ? (
            <View>
              <TextField.LabelText>
                <Trans>2FA confirmation code</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <TextField.Icon icon={TicketIcon} />
                <Dialog.Input
                  testID="legacyAuth2faInput"
                  label={l`2FA confirmation code`}
                  placeholder={null}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="one-time-code"
                  returnKeyType="done"
                  editable={!isProcessing}
                  value={authFactorToken}
                  onChangeText={value => {
                    setAuthFactorToken(value)
                    if (error) setError('')
                  }}
                  onSubmitEditing={() => {
                    void onSubmit()
                  }}
                />
              </TextField.Root>
            </View>
          ) : null}

          <Button
            testID="legacyAuthSubmitButton"
            label={l`Sign in with password`}
            size="large"
            color="primary"
            disabled={isProcessing}
            onPress={() => void onSubmit()}>
            {isProcessing && <ButtonIcon icon={Loader} />}
            <ButtonText>
              <Trans>Sign in with password</Trans>
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </>
  )
}

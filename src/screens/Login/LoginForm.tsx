import {useCallback, useRef, useState} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  type TextInput,
  View,
} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {DEFAULT_SERVICE, HITSLOP_10, HITSLOP_20} from '#/lib/constants'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {isValidDomain} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {useSessionApi} from '#/state/session'
import {getNativeOAuthClient} from '#/state/session/oauth-native-client'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, native, tokens, useBreakpoints, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {Eye_Stroke2_Corner0_Rounded as EyeIcon} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as TicketIcon} from '#/components/icons/Ticket'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_NATIVE} from '#/env'
import {HandleAutocompleteInput} from './components/HandleAutocompleteInput'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

type LoginMode = 'oauth' | 'legacy'

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
  debouncedResolveService,
  isResolvingService,
  onPressCreateAccount,
}: {
  error: string
  serviceUrl?: string | undefined
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
  debouncedResolveService: (identifier: string) => void
  isResolvingService: boolean
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const [mode, setMode] = useState<LoginMode>('oauth')
  const [isProcessing, setIsProcessing] = useState(false)

  const switchMode = (next: LoginMode) => {
    if (next === mode) return
    setError('')
    setMode(next)
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      <View
        style={[a.flex_row, a.mb_md, a.rounded_sm, a.overflow_hidden]}
        accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{selected: mode === 'oauth'}}
          onPress={() => switchMode('oauth')}
          style={[
            a.flex_1,
            a.align_center,
            a.py_sm,
            a.border_b,
            {borderBottomWidth: 2},
            mode === 'oauth'
              ? {borderBottomColor: t.palette.primary_500}
              : {borderBottomColor: 'transparent'},
          ]}>
          <Text
            style={[
              a.text_sm,
              a.font_bold,
              mode === 'oauth'
                ? {color: t.palette.primary_500}
                : t.atoms.text_contrast_medium,
            ]}>
            <Trans>OAuth</Trans>
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{selected: mode === 'legacy'}}
          onPress={() => switchMode('legacy')}
          style={[
            a.flex_1,
            a.align_center,
            a.py_sm,
            a.border_b,
            {borderBottomWidth: 2},
            mode === 'legacy'
              ? {borderBottomColor: t.palette.primary_500}
              : {borderBottomColor: 'transparent'},
          ]}>
          <Text
            style={[
              a.text_sm,
              a.font_bold,
              mode === 'legacy'
                ? {color: t.palette.primary_500}
                : t.atoms.text_contrast_medium,
            ]}>
            <Trans>Legacy sign-in</Trans>
          </Text>
        </Pressable>
      </View>

      {mode === 'oauth' ? (
        <OAuthLoginFields
          error={error}
          initialHandle={initialHandle}
          setError={setError}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          onAttemptSuccess={onAttemptSuccess}
        />
      ) : (
        <LegacyLoginFields
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={initialHandle}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressRetryConnect={onPressRetryConnect}
          onPressForgotPassword={onPressForgotPassword}
          onAttemptSuccess={onAttemptSuccess}
          onAttemptFailed={onAttemptFailed}
          debouncedResolveService={debouncedResolveService}
          isResolvingService={isResolvingService}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          onPressCreateAccount={onPressCreateAccount}
        />
      )}
    </FormContainer>
  )
}

function OAuthLoginFields({
  error,
  initialHandle,
  setError,
  isProcessing,
  setIsProcessing,
  onAttemptSuccess,
}: {
  error: string
  initialHandle: string
  setError: (v: string) => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
  onAttemptSuccess: () => void
}) {
  const {t: l} = useLingui()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()
  const identifierValueRef = useRef<string>(initialHandle || '')

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    setError('')

    const identifier = identifierValueRef.current.trim()

    if (!identifier) {
      setError(l`Please enter your username or handle`)
      return
    }

    setIsProcessing(true)

    try {
      const client = getNativeOAuthClient()
      const session = await client.signIn(identifier)
      await login(
        {
          service: '',
          identifier: '',
          password: '',
          oauthSession: session,
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
      requestNotificationsPermission('Login')
    } catch (e: any) {
      const errMsg = e.toString()
      setIsProcessing(false)
      if (errMsg.includes('cancelled') || errMsg.includes('dismiss')) {
        // User cancelled the browser auth flow
        return
      }
      if (isNetworkError(e)) {
        logger.warn(
          `Failed to start OAuth sign-in due to network error\n${e instanceof Error ? `${errMsg}\n${e.stack}\n${String(e.cause)}` : errMsg}`,
        )
        setError(
          l`Unable to contact your service. Please check your Internet connection.`,
        )
      } else {
        logger.warn(
          `Failed to start OAuth sign-in\n${e instanceof Error ? `${errMsg}\n${e.stack}\n${String(e.cause)}` : errMsg}`,
        )
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <>
      <View style={[a.relative, a.z_20, native({overflow: 'visible'})]}>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <HandleAutocompleteInput
          initialValue={initialHandle || ''}
          label={l`Handle, DID, or PDS address`}
          autoFocus={!IS_IOS}
          editable={!isProcessing}
          onValueChange={v => {
            identifierValueRef.current = v
          }}
          onSubmit={onPressNext}
        />
      </View>
      {error && (
        <Admonition.Admonition type="error">{error}</Admonition.Admonition>
      )}
      <View style={[a.pt_md]}>
        <Button
          testID="loginNextButton"
          label={l`Login`}
          accessibilityHint={l`Opens your authorization server to sign in`}
          color="primary"
          size="large"
          onPress={onPressNext}>
          <ButtonText>
            <Trans>Login</Trans>
          </ButtonText>
          {isProcessing && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </>
  )
}

function LegacyLoginFields({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
  debouncedResolveService,
  isResolvingService,
  isProcessing,
  setIsProcessing,
  onPressCreateAccount,
}: {
  error: string
  serviceUrl?: string | undefined
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
  debouncedResolveService: (identifier: string) => void
  isResolvingService: boolean
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
  onPressCreateAccount: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {login} = useSessionApi()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  const [errorField, setErrorField] = useState<
    'none' | 'identifier' | 'password' | '2fa'
  >('none')
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] = useState(false)
  const identifierValueRef = useRef(initialHandle || '')
  const passwordValueRef = useRef('')
  const [authFactorToken, setAuthFactorToken] = useState('')
  const identifierRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const hasFocusedOnce = useRef(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [revealPassword, setRevealPassword] = useState(false)

  const onPressSelectService = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const onPressNext = async () => {
    if (isProcessing || isResolvingService || serviceUrl === undefined) return
    Keyboard.dismiss()
    setError('')
    setErrorField('none')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current

    if (!identifier) {
      setError(l`Please enter your username`)
      setErrorField('identifier')
      return
    }

    if (!password) {
      setError(l`Please enter your password`)
      setErrorField('password')
      return
    }

    setIsProcessing(true)

    try {
      let fullIdent = identifier
      if (
        !identifier.includes('@') &&
        !identifier.includes('.') &&
        !identifier.startsWith('did:') &&
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullIdent.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullIdent = createFullHandle(
            identifier,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      // TODO remove double login
      await login(
        {
          service: serviceUrl,
          identifier: fullIdent,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
      void requestNotificationsPermission('Login')
    } catch (err) {
      const errMsg = String(err)
      setIsProcessing(false)
      if (
        err instanceof
        ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(l`Invalid 2FA confirmation code.`)
          setErrorField('2fa')
        } else if (
          errMsg.includes('Authentication Required') ||
          errMsg.includes('Invalid identifier or password')
        ) {
          logger.debug('Failed to login due to invalid credentials', {
            error: errMsg,
          })
          setError(l`Incorrect username or password`)
        } else if (isNetworkError(err)) {
          logger.warn('Failed to login due to network error', {error: errMsg})
          setError(
            l`Unable to contact your service. Please check your Internet connection.`,
          )
        } else {
          logger.warn('Failed to login', {error: errMsg})
          setError(cleanError(errMsg))
        }
      }
    }
  }

  return (
    <>
      <View>
        <TextField.LabelText>
          <Trans>Hosting provider</Trans>
          {isResolvingService && (
            <ActivityIndicator
              size={10}
              color={t.palette.contrast_500}
              style={a.ml_sm}
            />
          )}
        </TextField.LabelText>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>

      <View>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <TextField.Root isInvalid={errorField === 'identifier'}>
          <TextField.Icon icon={AtIcon} />
          <TextField.Input
            testID="loginUsernameInput"
            inputRef={identifierRef}
            label={
              serviceUrl === undefined
                ? l`Username (full handle)`
                : l`Username or email address`
            }
            placeholder={null}
            autoCapitalize="none"
            autoFocus={!IS_IOS && !initialHandle}
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            textContentType="username"
            defaultValue={initialHandle || ''}
            onChangeText={v => {
              identifierValueRef.current = v
              const id = v.trim()
              if (id) {
                if (
                  id.startsWith('did:') ||
                  (!id.includes('@') && isValidDomain(id))
                ) {
                  debouncedResolveService(id)
                }
              }
              if (errorField) setErrorField('none')
            }}
            onSubmitEditing={() => {
              passwordRef.current?.focus()
            }}
            blurOnSubmit={false}
            editable={!isProcessing}
            accessibilityHint={l`Enter the username or email address you used when you created your account`}
          />
        </TextField.Root>
      </View>

      <View>
        <TextField.LabelText>
          <Trans>Password</Trans>
        </TextField.LabelText>
        <TextField.Root isInvalid={errorField === 'password'}>
          <TextField.Icon icon={LockIcon} />
          <TextField.Input
            testID="loginPasswordInput"
            inputRef={passwordRef}
            label={l`Password`}
            placeholder={null}
            autoCapitalize="none"
            autoFocus={!IS_IOS && !!initialHandle}
            autoCorrect={false}
            autoComplete="current-password"
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
            secureTextEntry={!revealPassword}
            onChangeText={v => {
              passwordValueRef.current = v
              if (errorField) setErrorField('none')
              setHasPassword(!!v)
            }}
            onSubmitEditing={() => void onPressNext()}
            blurOnSubmit={false}
            editable={!isProcessing}
            accessibilityHint={l`Enter your password`}
            onLayout={
              IS_IOS
                ? () => {
                    if (hasFocusedOnce.current) return
                    hasFocusedOnce.current = true
                    if (initialHandle) {
                      passwordRef.current?.focus()
                    } else {
                      identifierRef.current?.focus()
                    }
                  }
                : undefined
            }
            hitSlop={{...HITSLOP_20, right: 0}}
          />
          <RevealPasswordButton
            active={revealPassword}
            hasPassword={hasPassword}
            onPress={() => setRevealPassword(r => !r)}
          />
        </TextField.Root>
        {!isAuthFactorTokenNeeded && (
          <Button
            label={l`Forgot password?`}
            accessibilityHint={l`Reset your password by sending a code to your email`}
            style={[a.mt_md, a.self_start]}
            hoverStyle={{opacity: 0.5}}
            hitSlop={HITSLOP_10}
            onPress={onPressForgotPassword}>
            <ButtonText style={[t.atoms.text_contrast_medium]}>
              <Trans>Forgot password?</Trans>
            </ButtonText>
          </Button>
        )}
      </View>

      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={errorField === '2fa'}>
            <TextField.Icon icon={TicketIcon} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={l`Confirmation code`}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="one-time-code"
              returnKeyType="done"
              blurOnSubmit={false}
              value={authFactorToken}
              onChangeText={text => {
                setAuthFactorToken(text)
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={() => void onPressNext()}
              editable={!isProcessing}
              accessibilityHint={l`Input the code which has been emailed to you`}
              style={{
                textTransform: authFactorToken === '' ? 'none' : 'uppercase',
              }}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>
              Check your email for a sign in code and enter it here.
            </Trans>
          </Text>
        </View>
      )}

      {error && (
        <Admonition.Admonition type="error">{error}</Admonition.Admonition>
      )}

      <View style={[a.pt_md, gtMobile && [a.justify_end, a.flex_row]]}>
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={l`Retry`}
            accessibilityHint={l`Retries signing in`}
            color="primary_subtle"
            size="large"
            onPress={onPressRetryConnect}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : !serviceDescription && serviceUrl !== undefined ? (
          <Button
            label={l`Connecting to service…`}
            size="large"
            color="secondary"
            disabled>
            <ButtonIcon icon={Loader} />
            <ButtonText>
              <Trans>Connecting…</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Button
            testID="loginNextButton"
            label={l`Sign in`}
            accessibilityHint={l`Navigates to the next screen`}
            color="primary"
            size="large"
            onPress={() => void onPressNext()}
            disabled={isResolvingService || serviceUrl === undefined}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>

      {IS_NATIVE && (
        <Text style={[a.text_md, native([a.text_center, a.mx_auto]), a.mt_sm]}>
          <Trans>
            New to Bluesky?{' '}
            <InlineLinkText
              label={l`Sign up`}
              style={[a.text_md, native(a.text_center)]}
              {...createStaticClick(() => onPressCreateAccount())}>
              Sign up
            </InlineLinkText>
          </Trans>
        </Text>
      )}
    </>
  )
}

function RevealPasswordButton({
  active,
  hasPassword,
  onPress,
}: {
  active: boolean
  hasPassword: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const context = TextField.useTextFieldContext()

  const Icon = !active ? EyeSlashIcon : EyeIcon

  if (!hasPassword && !context.focused) return null

  return (
    <View style={[a.z_10, a.pl_sm, {marginRight: tokens.space.xs * -1}]}>
      <Button
        testID="showPasswordButton"
        onPress={onPress}
        label={active ? l`Hide password` : l`Reveal password`}
        color="secondary"
        size="small"
        shape="round"
        style={[a.bg_transparent]}
        hitSlop={tokens.space.sm}>
        <Icon
          size="md"
          style={[
            context.focused ? t.atoms.text : t.atoms.text_contrast_medium,
          ]}
        />
      </Button>
    </View>
  )
}

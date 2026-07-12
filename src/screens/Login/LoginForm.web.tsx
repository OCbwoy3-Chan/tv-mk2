import {useRef, useState} from 'react'
import {Keyboard, Pressable, type TextInput, View} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {DEFAULT_SERVICE, HITSLOP_10, HITSLOP_20} from '#/lib/constants'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {isBlueskyHostedUrl, toNiceHostingUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {
  type HostingProviderState,
  useHostingProvider,
} from '#/state/queries/pds-detection'
import {useSession, useSessionApi} from '#/state/session'
import {getWebOAuthClient} from '#/state/session/oauth-web-client'
import {saveOAuthReturnUrl} from '#/state/session/oauth-web-return-url'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, native, tokens, useBreakpoints, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
import {Envelope_Stroke2_Corner0_Rounded as EmailIcon} from '#/components/icons/Envelope'
import {Eye_Stroke2_Corner0_Rounded as EyeIcon} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as TicketIcon} from '#/components/icons/Ticket'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {AppServerButton} from './components/AppServerDialog'
import {ConfirmHostingProviderDialog} from './components/ConfirmHostingProviderDialog'
import {HandleAutocompleteInput} from './components/HandleAutocompleteInput'
import {HostingProviderDialog} from './components/HostingProviderDialog'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

type LoginMode = 'oauth' | 'legacy'

/**
 * Web-specific LoginForm with two tabs:
 * - OAuth (default): handle-only flow, redirects to PDS authorization server
 * - Legacy sign-in: username + password with upstream hosting autodetection
 */
export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
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
          onPressBack={onPressBack}
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
          onPressBack={onPressBack}
          onPressForgotPassword={onPressForgotPassword}
          onAttemptSuccess={onAttemptSuccess}
          onAttemptFailed={onAttemptFailed}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
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
  onPressBack,
}: {
  error: string
  initialHandle: string
  setError: (v: string) => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
  onPressBack: () => void
}) {
  const {t: l} = useLingui()
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
      saveOAuthReturnUrl()
      const client = getWebOAuthClient()
      await client.signIn(identifier)
      // Browser will redirect to authorization server
    } catch (e: unknown) {
      const errMsg = String(e)
      setIsProcessing(false)
      if (isNetworkError(e)) {
        logger.warn('Failed to start OAuth sign-in due to network error', {
          error: errMsg,
        })
        setError(
          l`Unable to contact your service. Please check your Internet connection.`,
        )
      } else {
        logger.warn('Failed to start OAuth sign-in', {error: errMsg})
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <>
      <AppServerButton />
      <View style={[a.relative, a.z_20, native({overflow: 'visible'})]}>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <HandleAutocompleteInput
          initialValue={initialHandle || ''}
          label={l`Handle, DID, or PDS address`}
          placeholder={null}
          autoFocus
          editable={!isProcessing}
          onValueChange={v => {
            identifierValueRef.current = v
          }}
          onSubmit={() => void onPressNext()}
        />
      </View>
      {error && <Admonition.Admonition type="error">{error}</Admonition.Admonition>}
      <View style={[a.flex_row, a.align_center, a.pt_md]}>
        <Button
          label={l`Back`}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          testID="loginNextButton"
          label={l`Login`}
          accessibilityHint={l`Redirects to your authorization server`}
          color="primary"
          size="large"
          onPress={() => void onPressNext()}>
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
  onPressBack,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
  isProcessing,
  setIsProcessing,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
}) {
  const t = useTheme()
  const [errorField, setErrorField] = useState<
    'none' | 'identifier' | 'password' | '2fa'
  >('none')
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] = useState(false)
  const [showResolveError, setShowResolveError] = useState(false)
  const identifierValueRef = useRef(initialHandle || '')
  const passwordValueRef = useRef('')
  const [identifier, setIdentifier] = useState(initialHandle || '')
  const [identifierFocused, setIdentifierFocused] = useState(false)
  const [authFactorToken, setAuthFactorToken] = useState('')
  const identifierRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const [hasPassword, setHasPassword] = useState(false)
  const [revealPassword, setRevealPassword] = useState(false)
  const {t: l} = useLingui()
  const {login} = useSessionApi()
  const {accounts} = useSession()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()
  const serverInputControl = useDialogControl()
  const confirmHostingProviderControl = useDialogControl()
  const [pendingLogin, setPendingLogin] = useState<{
    service: string
    fullIdent: string
    passwordLength: number
  } | null>(null)
  const hostingProvider = useHostingProvider({
    identifier,
    defaultService: serviceUrl,
  })
  const {gtMobile} = useBreakpoints()

  const showUnresolvedError =
    hostingProvider.state.status === 'unresolved' && !identifierFocused

  const attemptLogin = async (service: string, fullIdent: string) => {
    const password = passwordValueRef.current
    setIsProcessing(true)

    try {
      await login(
        {
          service,
          identifier: fullIdent,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
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

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    setError('')
    setErrorField('none')
    setShowResolveError(false)

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

    let service: string
    let did: string | null
    try {
      ;({service, did} = await hostingProvider.resolveService(identifier))
    } catch (err) {
      logger.debug('Failed to resolve hosting provider', {error: String(err)})
      setIsProcessing(false)
      setShowResolveError(true)
      return
    }

    const isKnownAccount =
      did != null && accounts.some(account => account.did === did)
    const needsConfirmation =
      !isBlueskyHostedUrl(service) &&
      hostingProvider.state.status !== 'overridden' &&
      !isKnownAccount

    if (needsConfirmation) {
      setIsProcessing(false)
      setPendingLogin({service, fullIdent, passwordLength: password.length})
      confirmHostingProviderControl.open()
      return
    }

    await attemptLogin(service, fullIdent)
  }

  return (
    <>
      <HostingProviderDialog
        control={serverInputControl}
        currentOverride={
          hostingProvider.state.status === 'overridden'
            ? hostingProvider.state.pdsUrl
            : null
        }
        isEmail={hostingProvider.state.status === 'email'}
        onSelectManual={url => {
          hostingProvider.override(url)
          setServiceUrl(url)
        }}
        onSelectAutomatic={() => {
          hostingProvider.clearOverride()
          setServiceUrl(DEFAULT_SERVICE)
        }}
      />
      <ConfirmHostingProviderDialog
        control={confirmHostingProviderControl}
        host={toNiceHostingUrl(pendingLogin?.service ?? '')}
        identifier={pendingLogin?.fullIdent ?? ''}
        passwordLength={pendingLogin?.passwordLength ?? 0}
        onConfirm={() => {
          if (pendingLogin) {
            void attemptLogin(pendingLogin.service, pendingLogin.fullIdent)
          }
        }}
      />
      <AppServerButton />
      <View>
        <TextField.LabelText>
          <Trans>Username or email</Trans>
        </TextField.LabelText>
        <TextField.Root
          isInvalid={errorField === 'identifier' || showUnresolvedError}>
          <TextField.Icon
            icon={hostingProvider.state.status === 'email' ? EmailIcon : AtIcon}
          />
          <TextField.Input
            testID="loginUsernameInput"
            inputRef={identifierRef}
            label={l`Username or email address`}
            placeholder={null}
            autoCapitalize="none"
            autoFocus={!initialHandle}
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            textContentType="username"
            defaultValue={initialHandle || ''}
            onChangeText={v => {
              identifierValueRef.current = v
              setIdentifier(v)
              if (errorField) setErrorField('none')
              if (showResolveError) setShowResolveError(false)
            }}
            onFocus={() => setIdentifierFocused(true)}
            onBlur={() => setIdentifierFocused(false)}
            onSubmitEditing={() => {
              passwordRef.current?.focus()
            }}
            blurOnSubmit={false}
            editable={!isProcessing}
            accessibilityHint={l`Enter the username or email address you used when you created your account`}
          />
        </TextField.Root>
        {showUnresolvedError && (
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              a.mt_sm,
              {color: t.palette.negative_500},
            ]}>
            <Trans>
              We couldn't find an account with that username. Please check that
              you've typed it correctly, or{' '}
              <InlineLinkText
                label={l`set your hosting provider manually`}
                style={[a.text_sm, a.leading_snug]}
                {...createStaticClick(() => serverInputControl.open())}>
                set your hosting provider manually
              </InlineLinkText>
              .
            </Trans>
          </Text>
        )}
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
            autoFocus={!!initialHandle}
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

      {!showUnresolvedError &&
        (showResolveError ? (
          <Admonition.Outer type="error">
            <Admonition.Row>
              <Admonition.Icon />
              <Admonition.Content>
                <Admonition.Text>
                  <Trans>
                    We couldn’t verify your hosting provider. Check your
                    internet connection, or{' '}
                    <InlineLinkText
                      label={l`Set your hosting provider manually`}
                      style={[a.text_sm, a.leading_snug]}
                      {...createStaticClick(() => serverInputControl.open())}>
                      set your hosting provider manually
                    </InlineLinkText>
                    .
                  </Trans>
                </Admonition.Text>
              </Admonition.Content>
            </Admonition.Row>
          </Admonition.Outer>
        ) : (
          error && (
            <Admonition.Admonition type="error">{error}</Admonition.Admonition>
          )
        ))}

      <View
        style={[
          a.pt_md,
          gtMobile && [a.justify_between, a.flex_row, a.gap_sm],
        ]}>
        {gtMobile && (
          <>
            <Button
              label={l`Back`}
              color="secondary"
              size="large"
              onPress={onPressBack}>
              <ButtonText>
                <Trans>Back</Trans>
              </ButtonText>
            </Button>
            <View style={[a.flex_shrink, a.justify_center, a.ml_auto]}>
              <HostingProviderIndicator
                state={hostingProvider.state}
                onPress={() => serverInputControl.open()}
              />
            </View>
          </>
        )}
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
        ) : !serviceDescription ? (
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
            onPress={() => void onPressNext()}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>

      {!gtMobile && (
        <HostingProviderIndicator
          state={hostingProvider.state}
          onPress={() => serverInputControl.open()}
        />
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

function HostingProviderIndicator({
  state,
  onPress,
}: {
  state: HostingProviderState
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()

  return (
    <Button
      testID="selectServiceButton"
      label={l`Change hosting provider`}
      accessibilityHint={l`Opens a dialog to change the hosting provider you sign in to`}
      style={[!gtMobile && [a.mt_auto, a.mb_sm, a.self_center]]}
      size="small"
      color="secondary"
      variant="ghost"
      onPress={onPress}>
      <ButtonText
        style={[t.atoms.text_contrast_medium, a.font_normal]}
        numberOfLines={1}>
        {state.status === 'detected' || state.status === 'overridden' ? (
          <Trans>Hosting provider: {toNiceHostingUrl(state.pdsUrl)}</Trans>
        ) : state.status === 'email' ? (
          <Trans>Hosting provider: Bluesky</Trans>
        ) : (
          <Trans>Hosting provider</Trans>
        )}
      </ButtonText>
      <TinyChevronIcon width={8} style={[t.atoms.text_contrast_medium]} />
    </Button>
  )
}

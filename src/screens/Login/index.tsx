import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import Animated, {FadeIn, LayoutAnimationConfig} from 'react-native-reanimated'
import {type Did} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import debounce from 'lodash.debounce'

import {DEFAULT_SERVICE} from '#/lib/constants'
import {logger} from '#/logger'
import {useServiceQuery} from '#/state/queries/service'
import {type SessionAccount, useSession} from '#/state/session'
import {
  getPdsServiceUrlFromIdentityInfo,
  resolveIdentityUsingAppView,
} from '#/state/session/identity-resolver'
import {consumeOAuthCallbackError} from '#/state/session/oauth-web-return-url'
import {useLoggedOutView} from '#/state/shell/logged-out'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {ForgotPasswordForm} from '#/screens/Login/ForgotPasswordForm'
import {LoginForm} from '#/screens/Login/LoginForm'
import {PasswordUpdatedForm} from '#/screens/Login/PasswordUpdatedForm'
import {SetNewPasswordForm} from '#/screens/Login/SetNewPasswordForm'
import {atoms as a, native} from '#/alf'
import {ScreenTransition} from '#/components/ScreenTransition'
import {useAnalytics} from '#/analytics'
import {ChooseAccountForm} from './ChooseAccountForm'
import * as AuthLayout from './components/AuthLayout'
import {AuthLayoutNavigationContext} from './components/AuthLayout/context'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

const OrderedForms = [
  Forms.ChooseAccount,
  Forms.Login,
  Forms.ForgotPassword,
  Forms.SetNewPassword,
  Forms.PasswordUpdated,
] as const

export const Login = ({
  onPressBack,
  onPressCreateAccount,
}: {
  onPressBack: () => void
  onPressCreateAccount: () => void
}) => {
  const {t: l} = useLingui()
  const failedAttemptCountRef = useRef(0)
  const [startTime] = useState(() => Date.now())

  const {accounts} = useSession()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const requestedAccount = accounts.find(
    acc => acc.did === requestedAccountSwitchTo,
  )

  const [isResolvingService, setIsResolvingService] = useState(false)
  const [error, setError] = useState<string>('')
  const [serviceUrl, setServiceUrl] = useState<string | undefined>(
    requestedAccount?.service,
  )
  const [initialHandle, setInitialHandle] = useState(
    requestedAccount?.handle || '',
  )
  const [currentForm, setCurrentForm] = useState<Forms>(
    requestedAccount
      ? Forms.Login
      : accounts.length
        ? Forms.ChooseAccount
        : Forms.Login,
  )
  const [screenTransitionDirection, setScreenTransitionDirection] = useState<
    'Forward' | 'Backward'
  >('Forward')

  const ax = useAnalytics()
  const {
    data: serviceDescription,
    error: serviceError,
    refetch: refetchService,
  } = useServiceQuery(serviceUrl ?? '')

  const onSelectAccount = (account?: SessionAccount) => {
    if (account?.service) {
      setServiceUrl(account.service)
    }
    setInitialHandle(account?.handle || '')
    gotoForm(Forms.Login)
  }

  const gotoForm = (form: Forms) => {
    setError('')
    const index = OrderedForms.indexOf(currentForm)
    const nextIndex = OrderedForms.indexOf(form)
    setScreenTransitionDirection(index < nextIndex ? 'Forward' : 'Backward')
    setCurrentForm(form)
  }

  useEffect(() => {
    if (serviceError) {
      setError(
        l`Unable to contact your service. Please check your Internet connection.`,
      )
      logger.warn(`Failed to fetch service description for ${serviceUrl}`, {
        error: String(serviceError),
      })
      ax.metric('signin:hostingProviderFailedResolution', {})
    }
  }, [serviceError, serviceUrl, l, ax])

  useEffect(() => {
    const oauthCallbackError = consumeOAuthCallbackError()
    if (oauthCallbackError) {
      setError(oauthCallbackError)
      setCurrentForm(Forms.Login)
    }
  }, [])

  const resolveIdentity = useCallback(async (identifier: string) => {
    setIsResolvingService(true)

    try {
      const identity = await resolveIdentityUsingAppView(identifier)
      const did = identity.did as Did
      const pdsUrl = getPdsServiceUrlFromIdentityInfo(identity)

      if (!pdsUrl) {
        throw new Error(`No PDS service found in DID document for ${did}`)
      }

      if (pdsUrl.endsWith('.bsky.network')) {
        setServiceUrl('https://bsky.social')
      } else {
        setServiceUrl(pdsUrl)
      }
    } catch (err) {
      logger.error(
        `Service auto-resolution failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setIsResolvingService(false)
    }
  }, [])

  const debouncedResolveService = useMemo(
    () => debounce(resolveIdentity, 400),
    [resolveIdentity],
  )
  const onPressRetryConnect = useCallback(() => {
    void refetchService()
  }, [refetchService])
  const onDebouncedResolveService = useCallback(
    (identifier: string) => {
      void debouncedResolveService(identifier)
    },
    [debouncedResolveService],
  )

  const onPressForgotPassword = () => {
    gotoForm(Forms.ForgotPassword)
    ax.metric('signin:forgotPasswordPressed', {})
  }

  const handlePressBack = () => {
    onPressBack()
    setScreenTransitionDirection('Backward')
    ax.metric('signin:backPressed', {
      failedAttemptsCount: failedAttemptCountRef.current,
    })
  }

  const onAttemptSuccess = () => {
    ax.metric('signin:success', {
      isUsingCustomProvider: serviceUrl !== DEFAULT_SERVICE,
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      failedAttemptsCount: failedAttemptCountRef.current,
    })
  }

  const onAttemptFailed = () => {
    failedAttemptCountRef.current += 1
  }

  let content = null
  let title = ''
  let description = ''
  let goBack = null

  switch (currentForm) {
    case Forms.Login:
      title = l`Sign in`
      description = l`Enter your handle to sign in`
      goBack = () =>
        accounts.length ? gotoForm(Forms.ChooseAccount) : handlePressBack()
      content = (
        <LoginForm
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={initialHandle}
          setError={setError}
          onAttemptFailed={onAttemptFailed}
          onAttemptSuccess={onAttemptSuccess}
          setServiceUrl={setServiceUrl}
          onPressBack={goBack}
          onPressForgotPassword={onPressForgotPassword}
          onPressRetryConnect={onPressRetryConnect}
          debouncedResolveService={onDebouncedResolveService}
          isResolvingService={isResolvingService}
          onPressCreateAccount={onPressCreateAccount}
        />
      )
      break
    case Forms.ChooseAccount:
      title = l`Sign in`
      description = l`Select from an existing account`
      goBack = handlePressBack
      content = (
        <ChooseAccountForm
          onSelectAccount={onSelectAccount}
          onPressBack={goBack}
        />
      )
      break
    case Forms.ForgotPassword:
      title = l`Forgot Password`
      description = l`Let's get your password reset!`
      goBack = () => gotoForm(Forms.Login)
      content = (
        <ForgotPasswordForm
          error={error}
          serviceUrl={serviceUrl ?? DEFAULT_SERVICE}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={goBack}
          onEmailSent={() => gotoForm(Forms.SetNewPassword)}
        />
      )
      break
    case Forms.SetNewPassword:
      title = l`Forgot Password`
      description = l`Let's get your password reset!`
      goBack = () => gotoForm(Forms.ForgotPassword)
      content = (
        <SetNewPasswordForm
          error={error}
          serviceUrl={serviceUrl ?? DEFAULT_SERVICE}
          setError={setError}
          onPressBack={goBack}
          onPasswordSet={() => gotoForm(Forms.PasswordUpdated)}
        />
      )
      break
    case Forms.PasswordUpdated:
      title = l`Password updated`
      description = l`You can now sign in with your new password.`
      content = (
        <PasswordUpdatedForm onPressNext={() => gotoForm(Forms.Login)} />
      )
      break
  }

  const navigation = goBack ? {goBack} : null

  return (
    <AuthLayoutNavigationContext value={navigation}>
      <Animated.View style={a.flex_1} entering={native(FadeIn.duration(90))}>
        <KeyboardAvoidingView
          testID="signIn"
          behavior="padding"
          style={a.flex_1}
          automaticOffset>
          <AuthLayout.Header.Outer>
            <AuthLayout.Header.BackButton />
            <AuthLayout.Header.Content />
            <AuthLayout.Header.Slot />
          </AuthLayout.Header.Outer>
          <LoggedOutLayout
            leadin=""
            title={title}
            description={description}
            scrollable>
            <LayoutAnimationConfig skipEntering>
              <ScreenTransition
                key={currentForm}
                direction={screenTransitionDirection}
                style={a.flex_1}>
                {content}
              </ScreenTransition>
            </LayoutAnimationConfig>
          </LoggedOutLayout>
        </KeyboardAvoidingView>
      </Animated.View>
    </AuthLayoutNavigationContext>
  )
}

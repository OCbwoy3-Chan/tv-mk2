import {useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {Trans, useLingui} from '@lingui/react/macro'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
import * as persisted from '#/state/persisted'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {oauthSignupErrorMessage} from '#/screens/Signup/oauthSignupUtils'
import {
  normalizePdsUrl,
  SIGNUP_PROVIDERS,
  type SignupProvider,
  type SignupProviderId,
} from '#/screens/Signup/providers'
import {useStartOauthSignup} from '#/screens/Signup/startOauthSignup'
import {atoms as a, native, tokens, useBreakpoints, useTheme, web} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const inviteStatusPromise: Promise<Record<string, boolean>> = (async () => {
  const results: Record<string, boolean> = {}
  await Promise.allSettled(
    SIGNUP_PROVIDERS.filter(p => p.service && !p.custom).map(async p => {
      try {
        const res = await fetch(
          `${p.service}/xrpc/com.atproto.server.describeServer`,
        )
        if (res.ok) {
          const data = (await res.json()) as {inviteCodeRequired?: boolean}
          results[p.id] = !!data.inviteCodeRequired
        }
      } catch {
        // ignore unreachable providers
      }
    }),
  )
  return results
})()

export function Signup({
  onPressBack,
  onPressSignIn,
}: {
  onPressBack: () => void
  onPressSignIn: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const startOauthSignup = useStartOauthSignup()

  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customService, setCustomService] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<Record<string, boolean>>({})

  const providerNames: Record<SignupProviderId, string> = {
    bluesky: l`Bluesky`,
    blacksky: l`Blacksky`,
    eurosky: l`Eurosky`,
    custom: l`Enter a PDS address`,
  }

  useEffect(() => {
    void inviteStatusPromise.then(setInviteStatus)
  }, [])

  const startWithService = async (serviceUrl: string) => {
    setLoading(true)
    setError(null)
    try {
      await startOauthSignup(serviceUrl)
    } catch (e: unknown) {
      const message = oauthSignupErrorMessage(e, {
        network: l`Unable to contact your service. Please check your Internet connection.`,
        generic: l`Could not connect to this provider. Please try again.`,
      })
      setError(message)
      setLoading(false)
    }
  }

  const onSelectProvider = (provider: SignupProvider) => {
    if (loading) return
    if (provider.custom) {
      setShowCustomInput(true)
      setError(null)
      return
    }
    void startWithService(provider.service)
  }

  const onSubmitCustom = () => {
    if (loading) return
    const serviceUrl = normalizePdsUrl(customService)
    if (!serviceUrl) return

    const history = persisted.get('pdsAddressHistory') || []
    if (!history.includes(serviceUrl)) {
      void persisted.write('pdsAddressHistory', [
        serviceUrl,
        ...history.slice(0, 4),
      ])
    }

    void startWithService(serviceUrl)
  }

  return (
    <Animated.View exiting={native(FadeIn.duration(90))} style={a.flex_1}>
      <KeyboardAvoidingView behavior="padding" style={a.flex_1} automaticOffset>
        <LoggedOutLayout
          leadin=""
          title={l`Create account`}
          description={l`Welcome to the atmosphere!`}
          scrollable>
          <View testID="createAccount" style={a.flex_1}>
            <View
              style={[
                a.flex_1,
                a.px_xl,
                a.pt_2xl,
                !gtMobile && {paddingBottom: 100},
              ]}>
              <View style={[a.gap_sm, !showCustomInput && a.pb_xl]}>
                <Text style={[a.text_3xl, a.font_semi_bold]}>
                  {loading ? (
                    <Trans>Connecting…</Trans>
                  ) : showCustomInput ? (
                    <Trans>Enter a PDS address</Trans>
                  ) : (
                    <Trans>Choose a provider</Trans>
                  )}
                </Text>
                {!loading && showCustomInput && (
                  <Text
                    style={[
                      a.text_md,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>
                      Enter the address of the Personal Data Server 
                      that will host your account. You’ll finish 
                      creating your account through that provider.
                    </Trans>
                  </Text>
                )}
                {!loading && !showCustomInput && (
                  <Text
                    style={[
                      a.text_md,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>
                      Witchsky is a Bluesky client. If you already have an
                      account,{' '}
                      <InlineLinkText
                        label={l`sign in`}
                        style={[a.text_md, a.leading_snug]}
                        {...createStaticClick(() => {
                          onPressSignIn()
                        })}>
                        sign in
                      </InlineLinkText>{' '}
                      instead of creating a new one. Otherwise, choose a
                      provider to host your account! You can always switch 
                      to a different provider later, or even host your own.
                    </Trans>
                  </Text>
                )}
              </View>

              {loading ? (
                <Animated.View
                  entering={FadeIn}
                  exiting={FadeOut}
                  style={[a.align_center, a.py_5xl]}>
                  <Loader size="xl" />
                </Animated.View>
              ) : showCustomInput ? (
                <CustomPdsForm
                  customService={customService}
                  setCustomService={setCustomService}
                  error={error}
                  onBack={() => {
                    setShowCustomInput(false)
                    setError(null)
                  }}
                  onSubmit={onSubmitCustom}
                />
              ) : (
                <View style={[a.gap_md]}>
                  {error && (
                    <Admonition.Admonition type="error">
                      {error}
                    </Admonition.Admonition>
                  )}

                  <View style={[a.gap_sm]}>
                    {SIGNUP_PROVIDERS.map(provider => {
                      const name = providerNames[provider.id]
                      const Icon = provider.Icon
                      return (
                        <Pressable
                          key={provider.id}
                          testID={`signupProvider-${provider.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={name}
                          onPress={() => onSelectProvider(provider)}
                          style={({pressed, hovered}) => [
                            a.flex_row,
                            a.align_center,
                            a.gap_md,
                            a.p_md,
                            a.rounded_md,
                            t.atoms.bg_contrast_25,
                            (pressed || hovered) && t.atoms.bg_contrast_50,
                            web({cursor: 'pointer'}),
                          ]}>
                          <View
                            style={[
                              a.align_center,
                              a.justify_center,
                              a.rounded_full,
                              t.atoms.bg,
                              {
                                width: 36,
                                height: 36,
                              },
                              web({
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }),
                            ]}>
                            {Icon ? (
                              <Icon size="sm" style={[t.atoms.text]} />
                            ) : (
                              <GlobeIcon
                                size="sm"
                                fill={t.palette.contrast_600}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              a.flex_1,
                              a.text_md,
                              a.font_medium,
                              a.leading_tight,
                            ]}>
                            {name}
                          </Text>
                          {inviteStatus[provider.id] ? (
                            <View
                              style={[
                                a.px_xs,
                                a.py_2xs,
                                a.rounded_sm,
                                t.atoms.bg_contrast_100,
                              ]}>
                              <Text
                                style={[
                                  a.text_xs,
                                  a.font_semi_bold,
                                  t.atoms.text_contrast_medium,
                                ]}>
                                <Trans>Invite</Trans>
                              </Text>
                            </View>
                          ) : null}
                          <ChevronRight
                            size="sm"
                            fill={t.palette.contrast_400}
                          />
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )}

              {!showCustomInput && (
                <View style={[a.mt_xl]}>
                  <Button
                    label={l`Back`}
                    variant="solid"
                    color="secondary"
                    size="large"
                    onPress={onPressBack}
                    disabled={loading}>
                    <ButtonText>
                      <Trans>Back</Trans>
                    </ButtonText>
                  </Button>
                </View>
              )}

              <Divider style={[a.mt_xl]} />

              <View
                style={[
                  a.w_full,
                  a.py_lg,
                  a.flex_row,
                  a.gap_md,
                  a.align_center,
                ]}>
                <AppLanguageDropdown />
                <View
                  style={
                    gtMobile
                      ? [a.flex_1, a.flex, a.flex_row, a.justify_end]
                      : []
                  }>
                  <Text
                    style={[
                      t.atoms.text_contrast_medium,
                      !gtMobile && a.text_md,
                      {paddingInline: tokens.space.sm},
                    ]}>
                    <Trans>Having trouble?</Trans>{' '}
                    <InlineLinkText
                      label={l`Contact support`}
                      to={FEEDBACK_FORM_URL({})}
                      style={[!gtMobile && a.text_md]}>
                      <Trans>Open an issue</Trans>
                    </InlineLinkText>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LoggedOutLayout>
      </KeyboardAvoidingView>
    </Animated.View>
  )
}

function CustomPdsForm({
  customService,
  setCustomService,
  error,
  onBack,
  onSubmit,
}: {
  customService: string
  setCustomService: (v: string) => void
  error: string | null
  onBack: () => void
  onSubmit: () => void
}) {
  const {t: l} = useLingui()
  const [inputKey, setInputKey] = useState(0)
  const pdsAddressHistory = persisted.get('pdsAddressHistory') || []

  return (
    <View style={[a.gap_md, a.pt_md]}>
      <View>
        <TextField.Root>
          <TextField.Icon icon={GlobeIcon} />
          <TextField.Input
            key={inputKey}
            testID="customPdsInput"
            defaultValue={customService}
            onChangeText={setCustomService}
            label="selfhosted.social"
            autoCapitalize="none"
            autoFocus
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        </TextField.Root>
        {pdsAddressHistory.length > 0 && (
          <View style={[a.flex_row, a.flex_wrap, a.mt_xs, a.gap_xs]}>
            {pdsAddressHistory.map(uri => (
              <Button
                key={uri}
                variant="ghost"
                color="primary"
                label={uri}
                style={[a.px_sm, a.py_xs, a.rounded_sm]}
                onPress={() => {
                  setCustomService(uri)
                  setInputKey(k => k + 1)
                }}>
                <ButtonText>{uri}</ButtonText>
              </Button>
            ))}
          </View>
        )}
      </View>

      {error && (
        <Admonition.Admonition type="error">{error}</Admonition.Admonition>
      )}

      <View style={[a.flex_row, a.gap_md, a.pt_sm]}>
        <View style={a.flex_1}>
          <Button
            label={l`Back`}
            variant="solid"
            color="secondary"
            size="large"
            onPress={onBack}>
            <ButtonText>
              <Trans>Back</Trans>
            </ButtonText>
          </Button>
        </View>
        <View style={a.flex_1}>
          <Button
            testID="customPdsContinue"
            label={l`Continue`}
            color="primary"
            size="large"
            disabled={!customService.trim()}
            onPress={onSubmit}>
            <ButtonText>
              <Trans>Continue</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </View>
  )
}

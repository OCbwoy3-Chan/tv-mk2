import {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {Keyboard, View} from 'react-native'
import {isDid} from '@atproto/api'
import {reloadAppAsync} from 'expo'
import {Trans, useLingui} from '@lingui/react/macro'

import {usePrepareSettingsSyncForRestart} from '#/features/settingsSync'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {logger} from '#/logger'
import {
  APPVIEW_PRESETS,
  type AppViewPresetId,
  didWebFromAppViewUrl,
  getActiveAppViewPreset,
  getActiveAppViewTitle,
  normalizeAppViewUrl,
  useCustomAppViewDid,
  useCustomAppViewUrl,
  useSetAppViewSelection,
} from '#/state/preferences/custom-appview-did'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {findService, useDidDocument} from '#/state/queries/resolve-identity'
import {useServiceQuery} from '#/state/queries/service'
import {useSession, useSessionApi} from '#/state/session'
import {getNativeOAuthClient} from '#/state/session/oauth-native-client'
import {saveOAuthReturnUrl} from '#/state/session/oauth-web-return-url'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'

type AppViewSelection = {did: string | undefined; url: string | undefined}

type DialogInnerRef = {
  getFormState: () => AppViewSelection | 'invalid' | null
}

/**
 * How confirming a change takes effect.
 * - `login`: save only; applied when the next agent is created at sign-in
 * - `reauth`: OAuth account must sign in again
 * - `restart`: legacy account needs an app restart
 */
export type AppServerApplyMode = 'login' | 'reauth' | 'restart'

/**
 * Quiet App server control for the login form. Matches the Hosting provider
 * ghost button style.
 */
export function AppServerButton({
  onOpenDialog,
  inline = false,
}: {
  onOpenDialog?: () => void
  /**
   * Sit inline in a button row (skip the mobile self-centered layout).
   */
  inline?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const [did] = useCustomAppViewDid()
  const [url] = useCustomAppViewUrl()
  const control = Dialog.useDialogControl()
  const title = getActiveAppViewTitle(did, url)

  return (
    <>
      <Button
        testID="selectAppServerButton"
        label={l`App server: ${title}`}
        accessibilityHint={l`Opens a dialog to change the AppView used for feeds and profiles`}
        style={[!inline && !gtMobile && [a.mt_auto, a.mb_sm, a.self_center]]}
        size="small"
        color="secondary"
        variant="ghost"
        onPress={() => {
          Keyboard.dismiss()
          onOpenDialog?.()
          control.open()
        }}>
        <ButtonText
          style={[t.atoms.text_contrast_medium, a.font_normal]}
          numberOfLines={1}>
          {title}
        </ButtonText>
        <TinyChevronIcon width={8} style={[t.atoms.text_contrast_medium]} />
      </Button>
      <AppServerDialog control={control} applyMode="login" />
    </>
  )
}

/**
 * Compact header control showing the active App server name. Opens the switcher
 * dialog; applying a change reauthenticates (OAuth) or restarts (legacy).
 */
export function AppServerHeaderControl() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const {login, logoutCurrentAccount} = useSessionApi()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const prepareSettingsSyncForRestart = usePrepareSettingsSyncForRestart()
  const [did] = useCustomAppViewDid()
  const [url] = useCustomAppViewUrl()
  const control = Dialog.useDialogControl()
  const title = getActiveAppViewTitle(did, url)
  const isOauth = !!currentAccount?.isOauthSession
  const applyMode: AppServerApplyMode = isOauth ? 'reauth' : 'restart'

  const onApply = useCallback(async () => {
    if (!currentAccount) return

    if (applyMode === 'restart') {
      await prepareSettingsSyncForRestart()
      if (IS_WEB) {
        window.location.reload()
      } else {
        await reloadAppAsync()
      }
      return
    }

    // OAuth: re-run authorization so the new AppView proxy is attached.
    try {
      if (IS_WEB) {
        const {getWebOAuthClient} = await import(
          '#/state/session/oauth-web-client'
        )
        saveOAuthReturnUrl()
        const client = getWebOAuthClient()
        await client.signIn(currentAccount.handle)
        return
      }

      if (IS_NATIVE) {
        const client = getNativeOAuthClient()
        const session = await client.signIn(currentAccount.handle)
        await login(
          {
            service: '',
            identifier: '',
            password: '',
            oauthSession: session,
          },
          'Settings',
        )
      }
    } catch (e: unknown) {
      const errMsg = String(e)
      if (errMsg.includes('cancelled') || errMsg.includes('dismiss')) {
        return
      }
      logger.warn('App server reauth failed', {
        error: isNetworkError(e) ? errMsg : cleanError(errMsg),
      })
      logoutCurrentAccount('Settings')
      requestSwitchToAccount({requestedAccount: currentAccount.did})
    }
  }, [
    applyMode,
    currentAccount,
    login,
    logoutCurrentAccount,
    prepareSettingsSyncForRestart,
    requestSwitchToAccount,
  ])

  return (
    <>
      <View style={[a.z_50, a.align_end, {maxWidth: 140}]}>
        <Button
          testID="settingsAppServerHeaderBtn"
          label={l`App server: ${title}`}
          accessibilityHint={
            isOauth
              ? l`Change App server. You’ll need to sign in again.`
              : l`Change App server. The app will restart.`
          }
          size="small"
          variant="ghost"
          color="secondary"
          style={[a.px_xs, a.py_xs]}
          onPress={() => control.open()}>
          <ButtonText
            style={[a.text_sm, a.font_normal, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {title}
          </ButtonText>
          <TinyChevronIcon width={8} style={[t.atoms.text_contrast_medium]} />
        </Button>
      </View>
      <AppServerDialog
        control={control}
        applyMode={applyMode}
        onApply={() => void onApply()}
      />
    </>
  )
}

export function AppServerDialog({
  control,
  applyMode = 'login',
  onApply,
}: {
  control: Dialog.DialogOuterProps['control']
  applyMode?: AppServerApplyMode
  /**
   * Called after a changed selection is saved, when `applyMode` is not `login`.
   */
  onApply?: () => void
}) {
  const formRef = useRef<DialogInnerRef>(null)
  const confirmedRef = useRef(false)
  const navigation = useNavigationDeduped()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const [did] = useCustomAppViewDid()
  const [url] = useCustomAppViewUrl()
  const setAppViewSelection = useSetAppViewSelection()
  const [preset, setPreset] = useState<AppViewPresetId>(() =>
    getActiveAppViewPreset(did, url),
  )
  const [customUrl, setCustomUrl] = useState(() =>
    getActiveAppViewPreset(did, url) === 'custom' ? (url ?? '') : '',
  )

  const resetLocalState = useCallback(() => {
    setPreset(getActiveAppViewPreset(did, url))
    setCustomUrl(
      getActiveAppViewPreset(did, url) === 'custom' ? (url ?? '') : '',
    )
  }, [did, url])

  const onClose = useCallback(() => {
    const result = formRef.current?.getFormState()
    const shouldApply =
      applyMode === 'login' || confirmedRef.current === true
    confirmedRef.current = false

    if (!shouldApply || !result || result === 'invalid') {
      resetLocalState()
      return
    }

    const nextDid = result.did
    const nextUrl = result.url
    const changed = nextDid !== did || nextUrl !== (url ?? undefined)
    if (!changed) return

    setAppViewSelection({did: nextDid, url: nextUrl})
    if (applyMode !== 'login') {
      onApply?.()
    }
  }, [
    applyMode,
    did,
    url,
    setAppViewSelection,
    onApply,
    resetLocalState,
  ])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <AppServerDialogInner
        formRef={formRef}
        preset={preset}
        setPreset={setPreset}
        customUrl={customUrl}
        setCustomUrl={setCustomUrl}
        applyMode={applyMode}
        onConfirm={() => {
          confirmedRef.current = true
          control.close()
        }}
        onOpenInfrastructureSettings={() => {
          control.close(() => {
            setShowLoggedOut(false)
            navigation.navigate('RunesInfrastructureSettings')
          })
        }}
      />
    </Dialog.Outer>
  )
}

function AppServerDialogInner({
  formRef,
  preset,
  setPreset,
  customUrl,
  setCustomUrl,
  applyMode,
  onConfirm,
  onOpenInfrastructureSettings,
}: {
  formRef: React.Ref<DialogInnerRef>
  preset: AppViewPresetId
  setPreset: (preset: AppViewPresetId) => void
  customUrl: string
  setCustomUrl: (url: string) => void
  applyMode: AppServerApplyMode
  onConfirm: () => void
  onOpenInfrastructureSettings: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const enableSquareButtons = useEnableSquareButtons()

  const normalizedCustomUrl = normalizeAppViewUrl(customUrl)
  const derivedDid =
    preset === 'custom' ? didWebFromAppViewUrl(normalizedCustomUrl) : undefined
  const doc = useDidDocument({did: derivedDid ?? ''})
  const bskyAppViewService =
    doc.data && findService(doc.data, '#bsky_appview', 'BskyAppView')
  const atprotoPdsService =
    doc.data &&
    findService(doc.data, '#atproto_pds', 'AtprotoPersonalDataServer')

  /*
   * When the DID doc has no AppView, probe describeServer so we can tell PDS
   * hosts (e.g. bsky.social) apart from typos / unrelated sites.
   */
  const hasPdsInDidDoc =
    !!atprotoPdsService?.serviceEndpoint &&
    !bskyAppViewService?.serviceEndpoint
  const shouldProbePds =
    preset === 'custom' &&
    !!normalizedCustomUrl &&
    !doc.isLoading &&
    !bskyAppViewService?.serviceEndpoint &&
    !hasPdsInDidDoc
  const pdsProbe = useServiceQuery(shouldProbePds ? normalizedCustomUrl : '')
  const looksLikePds = hasPdsInDidDoc || (shouldProbePds && pdsProbe.isSuccess)

  const customIsValid =
    preset !== 'custom' ||
    (!!normalizedCustomUrl &&
      !!derivedDid &&
      isDid(derivedDid) &&
      !!bskyAppViewService?.serviceEndpoint)

  useImperativeHandle(
    formRef,
    () => ({
      getFormState: () => {
        if (preset === 'bluesky') {
          return {did: undefined, url: undefined}
        }
        if (preset === 'blacksky') {
          return {
            did: APPVIEW_PRESETS.blacksky.did,
            url: APPVIEW_PRESETS.blacksky.url,
          }
        }
        if (!customIsValid || !derivedDid) {
          return 'invalid'
        }
        return {
          did: derivedDid,
          url: bskyAppViewService?.serviceEndpoint || normalizedCustomUrl,
        }
      },
    }),
    [
      preset,
      customIsValid,
      derivedDid,
      bskyAppViewService?.serviceEndpoint,
      normalizedCustomUrl,
    ],
  )

  const confirmLabel =
    applyMode === 'reauth'
      ? l`Reauthenticate`
      : applyMode === 'restart'
        ? l`Restart`
        : l`Done`

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title"
      style={web([
        {
          maxWidth: 400,
          borderRadius: enableSquareButtons ? 18 : 36,
        },
      ])}>
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text
          nativeID="dialog-title"
          style={[a.text_2xl, a.font_bold, a.pr_5xl]}>
          <Trans>Choose your app server</Trans>
        </Text>

        <SegmentedControl.Root
          type="tabs"
          label={l`App server`}
          value={preset}
          onChange={setPreset}>
          <SegmentedControl.Item
            testID="appServerBlueskyBtn"
            value="bluesky"
            label={l`Bluesky`}>
            <SegmentedControl.ItemText>{l`Bluesky`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item
            testID="appServerBlackskyBtn"
            value="blacksky"
            label={l`Blacksky`}>
            <SegmentedControl.ItemText>{l`Blacksky`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item
            testID="appServerCustomBtn"
            value="custom"
            label={l`Custom`}>
            <SegmentedControl.ItemText>{l`Custom`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>

        {preset === 'custom' && (
          <View role="tabpanel">
            <TextField.LabelText nativeID="appview-url-label">
              <Trans>AppView URL</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <TextField.Icon icon={Globe} />
              <Dialog.Input
                testID="customAppViewUrlInput"
                defaultValue={customUrl}
                onChangeText={setCustomUrl}
                label="https://api.example.com"
                accessibilityLabelledBy="appview-url-label"
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
            </TextField.Root>
            {!!normalizedCustomUrl &&
              !!derivedDid &&
              (doc.isLoading || (shouldProbePds && pdsProbe.isLoading)) && (
              <View style={[a.flex_row, a.align_center, a.gap_sm, a.mt_sm]}>
                <Loader size="sm" />
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>Looking up AppView…</Trans>
                </Text>
              </View>
            )}
            {!!normalizedCustomUrl &&
              !!derivedDid &&
              !doc.isLoading &&
              !(shouldProbePds && pdsProbe.isLoading) &&
              !bskyAppViewService?.serviceEndpoint && (
                <View style={[a.mt_sm]}>
                  <Admonition type="error">
                    {looksLikePds ? (
                      <Trans>
                        This looks like a hosting provider (PDS) address, not an
                        AppView. Your PDS is detected from your handle, or set 
                        separately under Hosting provider; don’t enter it here!
                      </Trans>
                    ) : (
                      <Trans>
                        Couldn’t find a #bsky_appview service at this URL. Check
                        the address and try again.
                      </Trans>
                    )}
                  </Admonition>
                </View>
              )}
          </View>
        )}

        <Text
          nativeID="dialog-description"
          style={[t.atoms.text_contrast_medium, a.text_sm, a.leading_snug]}>
          <Trans>
            The app server (AppView) provides posts, feeds, profiles, search,
            notifications, and mutes. Your account still lives with your
            hosting provider.
          </Trans>
        </Text>

        <Button
          testID="appServerDoneBtn"
          color="primary"
          size="large"
          onPress={onConfirm}
          label={confirmLabel}
          disabled={preset === 'custom' && !customIsValid}>
          <ButtonText>{confirmLabel}</ButtonText>
        </Button>

        <Text style={[t.atoms.text_contrast_medium, a.text_sm, a.leading_snug]}>
          <Trans>See also:</Trans>{' '}
          <InlineLinkText
            label={l`Infrastructure settings`}
            {...createStaticClick(() => onOpenInfrastructureSettings())}>
            <Trans>Infrastructure settings</Trans>
          </InlineLinkText>
        </Text>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

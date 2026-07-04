import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {useProfileQuery, useProfilesQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {SwitchMenuItems} from '#/view/shell/desktop/LeftNav'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {IS_NATIVE, IS_WEB, IS_WEB_TOUCH_DEVICE} from '#/env'

type AccountListItem = {
  account: SessionAccount
  profile?: AppBskyActorDefs.ProfileViewDetailed
}

export type SwitcherTriggerProps = {
  ref: null
  onPress: (() => void) | undefined
  onLongPress?: (() => void) | undefined
  onFocus: () => void
  onBlur: () => void
  onPressIn: () => void
  onPressOut: () => void
  accessibilityLabel: string
  accessibilityRole: 'button'
}

type SwitcherRequest = {
  title: string
  onSelectAccount: (account: SessionAccount) => void
  accounts?: AccountListItem[]
  resolveAccounts?: () => Promise<AccountListItem[]>
}

type EphemeralAccountSwitcherContextValue = {
  hasAlternateAccounts: boolean
  currentProfile?: AppBskyActorDefs.ProfileViewDetailed
  switcherAccounts: AccountListItem[]
  signOutPromptControl: ReturnType<typeof Prompt.usePromptControl>
  getLongPressProps: (request: SwitcherRequest) => Pick<
    SwitcherTriggerProps,
    'onLongPress' | 'accessibilityLabel' | 'accessibilityRole'
  >
}

const EphemeralAccountSwitcherContext =
  createContext<EphemeralAccountSwitcherContextValue | null>(null)

const noopTriggerProps: SwitcherTriggerProps = {
  ref: null,
  onPress: undefined,
  onLongPress: undefined,
  onFocus: () => {},
  onBlur: () => {},
  onPressIn: () => {},
  onPressOut: () => {},
  accessibilityLabel: '',
  accessibilityRole: 'button',
}

function useEphemeralAccountSwitcherData(selectedDid: string) {
  const {accounts} = useSession()
  const {data: currentProfile} = useProfileQuery({did: selectedDid})
  const {data} = useProfilesQuery({
    handles: accounts.map(acc => acc.did),
  })
  const profiles = data?.profiles

  const switcherAccounts = useMemo<AccountListItem[]>(
    () =>
      accounts
        .filter(account => account.did !== selectedDid)
        .map(account => ({
          account,
          profile: profiles?.find(p => p.did === account.did),
        })),
    [accounts, profiles, selectedDid],
  )

  return {
    switcherAccounts,
    hasAlternateAccounts: switcherAccounts.length > 0,
    currentProfile,
  }
}

export function EphemeralAccountSwitcherScope({
  selectedDid,
  children,
}: {
  selectedDid: string
  children: React.ReactNode
}) {
  const {t: l} = useLingui()
  const {switcherAccounts, hasAlternateAccounts, currentProfile} =
    useEphemeralAccountSwitcherData(selectedDid)
  const menuControl = Menu.useMenuControl()
  const signOutPromptControl = Prompt.usePromptControl()
  const dismissGuardRef = useRef(false)
  const [activeRequest, setActiveRequest] = useState<SwitcherRequest | null>(
    null,
  )
  const [resolvedAccounts, setResolvedAccounts] = useState<
    AccountListItem[] | null
  >(null)
  const [isResolvingAccounts, setIsResolvingAccounts] = useState(false)

  const openMenuControl = useCallback(() => {
    if (IS_WEB && !IS_WEB_TOUCH_DEVICE) {
      dismissGuardRef.current = true
      menuControl.open()

      const releaseGuard = () => {
        requestAnimationFrame(() => {
          dismissGuardRef.current = false
        })
      }
      window.addEventListener('pointerup', releaseGuard, {once: true})
      window.addEventListener('pointercancel', releaseGuard, {once: true})
      return
    }
    menuControl.open()
  }, [menuControl])

  const openSwitcher = useCallback(
    (request: SwitcherRequest) => {
      setActiveRequest(request)

      if (request.resolveAccounts) {
        setResolvedAccounts(null)
        setIsResolvingAccounts(true)
        openMenuControl()
        void request.resolveAccounts().then(accounts => {
          setResolvedAccounts(accounts)
          setIsResolvingAccounts(false)
          if (accounts.length === 0) {
            menuControl.close()
          }
        }).catch(() => {
          setIsResolvingAccounts(false)
          menuControl.close()
        })
        return
      }

      const accounts = request.accounts ?? switcherAccounts
      if (accounts.length === 0) return
      setResolvedAccounts(accounts)
      openMenuControl()
    },
    [switcherAccounts, menuControl, openMenuControl],
  )

  const handleSelectAccount = useCallback(
    (account: SessionAccount) => {
      activeRequest?.onSelectAccount(account)
    },
    [activeRequest],
  )

  const getLongPressProps = useCallback(
    (request: SwitcherRequest) => {
      const accounts = request.accounts ?? switcherAccounts
      if (accounts.length === 0 && !request.resolveAccounts) {
        return {
          onLongPress: undefined,
          accessibilityLabel: l`Switch accounts`,
          accessibilityRole: 'button' as const,
        }
      }

      return {
        onLongPress: () => openSwitcher(request),
        accessibilityLabel: l`Switch accounts`,
        accessibilityRole: 'button' as const,
      }
    },
    [l, openSwitcher, switcherAccounts],
  )

  const menuAccounts = useMemo(() => {
    if (resolvedAccounts !== null) {
      return resolvedAccounts
    }
    return activeRequest?.accounts ?? switcherAccounts
  }, [activeRequest?.accounts, resolvedAccounts, switcherAccounts])

  const contextValue = useMemo<EphemeralAccountSwitcherContextValue>(
    () => ({
      hasAlternateAccounts,
      currentProfile,
      switcherAccounts,
      signOutPromptControl,
      getLongPressProps,
    }),
    [
      currentProfile,
      getLongPressProps,
      hasAlternateAccounts,
      signOutPromptControl,
      switcherAccounts,
    ],
  )

  return (
    <EphemeralAccountSwitcherContext.Provider value={contextValue}>
      {children}
      {hasAlternateAccounts && (IS_NATIVE || (IS_WEB && !IS_WEB_TOUCH_DEVICE)) ? (
        <Menu.Root
          control={menuControl}
          modal={IS_NATIVE}
          disableBackdrop={!IS_NATIVE}
          dismissGuardRef={IS_NATIVE ? undefined : dismissGuardRef}>
          <SwitchMenuItems
            accounts={menuAccounts}
            isLoading={isResolvingAccounts}
            signOutPromptControl={signOutPromptControl}
            showExtraButtons={false}
            showAddAccount={false}
            title={activeRequest?.title}
            onSelectAccount={handleSelectAccount}
          />
        </Menu.Root>
      ) : null}
    </EphemeralAccountSwitcherContext.Provider>
  )
}

export function useEphemeralAccountSwitcher() {
  const context = useContext(EphemeralAccountSwitcherContext)
  if (!context) {
    throw new Error(
      'useEphemeralAccountSwitcher must be used within EphemeralAccountSwitcherScope',
    )
  }
  return context
}

export function EphemeralAccountSwitcherMenu({
  title,
  onSelectAccount,
  accounts: accountsOverride,
  resolveAccounts,
  renderTrigger,
}: {
  title: string
  onSelectAccount: (account: SessionAccount) => void
  accounts?: AccountListItem[]
  resolveAccounts?: () => Promise<AccountListItem[]>
  renderTrigger: (args: {
    currentProfile?: AppBskyActorDefs.ProfileViewDetailed
    triggerProps: SwitcherTriggerProps
  }) => React.ReactNode
}) {
  const {t: l} = useLingui()
  const {
    hasAlternateAccounts,
    currentProfile,
    switcherAccounts,
    signOutPromptControl,
  } = useEphemeralAccountSwitcher()
  const menuAccounts = accountsOverride ?? switcherAccounts
  const hasMenuAccounts = resolveAccounts
    ? hasAlternateAccounts
    : menuAccounts.length > 0
  const menuControl = Menu.useMenuControl()
  const dismissGuardRef = useRef(false)
  const [resolvedAccounts, setResolvedAccounts] = useState<
    AccountListItem[] | null
  >(null)
  const [isResolvingAccounts, setIsResolvingAccounts] = useState(false)

  const displayedAccounts =
    resolveAccounts && resolvedAccounts !== null
      ? resolvedAccounts
      : menuAccounts

  useEffect(() => {
    if (!IS_WEB || !menuControl.isOpen) {
      if (!menuControl.isOpen) {
        setResolvedAccounts(null)
        setIsResolvingAccounts(false)
      }
      return
    }

    if (!resolveAccounts || isResolvingAccounts || resolvedAccounts !== null) {
      return
    }

    setIsResolvingAccounts(true)
    void resolveAccounts()
      .then(accounts => {
        setResolvedAccounts(accounts)
        setIsResolvingAccounts(false)
        if (accounts.length === 0) {
          menuControl.close()
        }
      })
      .catch(() => {
        setIsResolvingAccounts(false)
        menuControl.close()
      })
  }, [
    isResolvingAccounts,
    menuControl,
    menuControl.isOpen,
    resolveAccounts,
    resolvedAccounts,
  ])

  const openMenu = useCallback(() => {
    if (menuControl.isOpen) {
      return
    }
    dismissGuardRef.current = true
    menuControl.open()

    const releaseGuard = () => {
      requestAnimationFrame(() => {
        dismissGuardRef.current = false
      })
    }
    window.addEventListener('pointerup', releaseGuard, {once: true})
    window.addEventListener('pointercancel', releaseGuard, {once: true})
  }, [menuControl])

  if (!hasAlternateAccounts || !hasMenuAccounts) {
    return renderTrigger({
      currentProfile,
      triggerProps: {
        ...noopTriggerProps,
        accessibilityLabel: l`Switch accounts`,
      },
    })
  }

  return (
    <Menu.Root
      control={menuControl}
      modal={false}
      disableBackdrop
      dismissGuardRef={dismissGuardRef}>
      <Menu.Trigger label={l`Switch accounts`}>
        {({props: menuTriggerProps}) => (
          <View {...(menuTriggerProps as object)}>
            {renderTrigger({
              currentProfile,
              triggerProps: {
                ref: null,
                onPress: undefined,
                onLongPress: openMenu,
                onFocus: () => {},
                onBlur: () => {},
                onPressIn: () => {},
                onPressOut: () => {},
                accessibilityLabel: l`Switch accounts`,
                accessibilityRole: 'button',
              },
            })}
          </View>
        )}
      </Menu.Trigger>
      <SwitchMenuItems
        accounts={displayedAccounts}
        isLoading={isResolvingAccounts}
        signOutPromptControl={signOutPromptControl}
        showExtraButtons={false}
        showAddAccount={false}
        title={title}
        onSelectAccount={onSelectAccount}
      />
    </Menu.Root>
  )
}

export function EphemeralAccountSwitcher({
  selectedDid,
  title,
  onSelectAccount,
  triggerBehavior = 'press',
  accounts: accountsOverride,
  resolveAccounts,
  renderTrigger,
}: {
  selectedDid: string
  title: string
  onSelectAccount: (account: SessionAccount) => void
  triggerBehavior?: 'press' | 'longPress'
  accounts?: AccountListItem[]
  resolveAccounts?: () => Promise<AccountListItem[]>
  renderTrigger: (args: {
    currentProfile?: AppBskyActorDefs.ProfileViewDetailed
    triggerProps: SwitcherTriggerProps
  }) => React.ReactNode
}) {
  const {t: l} = useLingui()
  const {switcherAccounts, hasAlternateAccounts, currentProfile} =
    useEphemeralAccountSwitcherData(selectedDid)
  const menuAccounts = accountsOverride ?? switcherAccounts
  const control = useDialogControl()
  const menuControl = Menu.useMenuControl()
  const signOutPromptControl = Prompt.usePromptControl()
  const [resolvedAccounts, setResolvedAccounts] = useState<
    AccountListItem[] | null
  >(null)
  const [isResolvingAccounts, setIsResolvingAccounts] = useState(false)

  const dialogAccounts =
    resolveAccounts && resolvedAccounts !== null
      ? resolvedAccounts
      : menuAccounts

  const openDialog = useCallback(() => {
    if (resolveAccounts) {
      setResolvedAccounts(null)
      setIsResolvingAccounts(true)
      control.open()
      void resolveAccounts().then(accounts => {
        setResolvedAccounts(accounts)
        setIsResolvingAccounts(false)
        if (accounts.length === 0) {
          control.close()
        }
      }).catch(() => {
        setIsResolvingAccounts(false)
        control.close()
      })
      return
    }
    control.open()
  }, [control, resolveAccounts])

  const hasMenuAccounts = resolveAccounts
    ? hasAlternateAccounts
    : menuAccounts.length > 0
  const displayedAccounts =
    resolveAccounts && resolvedAccounts !== null
      ? resolvedAccounts
      : menuAccounts

  const openMenuWithResolve = useCallback(() => {
    if (!resolveAccounts) {
      menuControl.open()
      return
    }

    setResolvedAccounts(null)
    setIsResolvingAccounts(true)
    menuControl.open()
    void resolveAccounts()
      .then(accounts => {
        setResolvedAccounts(accounts)
        setIsResolvingAccounts(false)
        if (accounts.length === 0) {
          menuControl.close()
        }
      })
      .catch(() => {
        setIsResolvingAccounts(false)
        menuControl.close()
      })
  }, [menuControl, resolveAccounts])

  if (!hasAlternateAccounts || !hasMenuAccounts) {
    return renderTrigger({
      currentProfile,
      triggerProps: {
        ...noopTriggerProps,
        accessibilityLabel: l`Switch accounts`,
      },
    })
  }

  if (!IS_WEB_TOUCH_DEVICE && triggerBehavior === 'longPress') {
    return (
      <EphemeralAccountSwitcherScope selectedDid={selectedDid}>
        {IS_NATIVE ? (
          <EphemeralAccountSwitcherNativeTrigger
            request={{title, onSelectAccount, resolveAccounts}}
            renderTrigger={renderTrigger}
          />
        ) : (
          <EphemeralAccountSwitcherMenu
            title={title}
            onSelectAccount={onSelectAccount}
            resolveAccounts={resolveAccounts}
            renderTrigger={renderTrigger}
          />
        )}
      </EphemeralAccountSwitcherScope>
    )
  }

  if (IS_WEB_TOUCH_DEVICE) {
    const openProps =
      triggerBehavior === 'longPress'
        ? {onPress: undefined, onLongPress: openDialog}
        : {onPress: openDialog, onLongPress: undefined}

    return (
      <>
        {renderTrigger({
          currentProfile,
          triggerProps: {
            ref: null,
            ...openProps,
            onFocus: () => {},
            onBlur: () => {},
            onPressIn: () => {},
            onPressOut: () => {},
            accessibilityLabel: l`Switch accounts`,
            accessibilityRole: 'button',
          },
        })}
        <SwitchAccountDialog
          control={control}
          accounts={dialogAccounts.map(item => item.account)}
          isLoading={isResolvingAccounts}
          pendingDid={null}
          selectedDid={selectedDid}
          title={title}
          showAddAccount={false}
          onSelectAccount={onSelectAccount}
        />
      </>
    )
  }

  return (
    <Menu.Root control={resolveAccounts ? menuControl : undefined}>
      <Menu.Trigger label={l`Switch accounts`}>
        {({props}) =>
          renderTrigger({
            currentProfile,
            triggerProps: {
              ...(props as SwitcherTriggerProps),
              onPress: resolveAccounts
                ? openMenuWithResolve
                : (props as SwitcherTriggerProps).onPress,
            },
          })
        }
      </Menu.Trigger>
      <SwitchMenuItems
        accounts={displayedAccounts}
        isLoading={resolveAccounts ? isResolvingAccounts : undefined}
        signOutPromptControl={signOutPromptControl}
        showExtraButtons={false}
        showAddAccount={false}
        title={title}
        onSelectAccount={onSelectAccount}
      />
    </Menu.Root>
  )
}

function EphemeralAccountSwitcherNativeTrigger({
  request,
  renderTrigger,
}: {
  request: SwitcherRequest
  renderTrigger: (args: {
    currentProfile?: AppBskyActorDefs.ProfileViewDetailed
    triggerProps: SwitcherTriggerProps
  }) => React.ReactNode
}) {
  const {currentProfile, getLongPressProps} = useEphemeralAccountSwitcher()

  return (
    <View>
      {renderTrigger({
        currentProfile,
        triggerProps: {
          ...noopTriggerProps,
          ...getLongPressProps(request),
        },
      })}
    </View>
  )
}

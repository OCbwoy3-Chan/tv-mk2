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
import {IS_WEB, IS_WEB_TOUCH_DEVICE} from '#/env'

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

type EphemeralAccountSwitcherContextValue = {
  hasAlternateAccounts: boolean
  currentProfile?: AppBskyActorDefs.ProfileViewDetailed
  switcherAccounts: AccountListItem[]
  signOutPromptControl: ReturnType<typeof Prompt.usePromptControl>
}

type EphemeralAccountSwitcherData = Pick<
  EphemeralAccountSwitcherContextValue,
  'currentProfile' | 'hasAlternateAccounts' | 'switcherAccounts'
>

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

function useEphemeralAccountSwitcherData(
  selectedDid: string,
  currentProfileFromBatch = false,
) {
  const {accounts} = useSession()
  const {data: currentProfileQuery} = useProfileQuery({
    did: currentProfileFromBatch ? undefined : selectedDid,
  })
  const {data} = useProfilesQuery({
    handles: accounts
      .filter(account => currentProfileFromBatch || account.did !== selectedDid)
      .map(account => account.did),
  })
  const profiles = data?.profiles
  const currentProfile = currentProfileFromBatch
    ? profiles?.find(profile => profile.did === selectedDid)
    : currentProfileQuery

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

function EphemeralAccountSwitcherProvider({
  data: {switcherAccounts, hasAlternateAccounts, currentProfile},
  signOutPromptControl,
  children,
}: {
  data: EphemeralAccountSwitcherData
  signOutPromptControl: ReturnType<typeof Prompt.usePromptControl>
  children: React.ReactNode
}) {
  const contextValue = useMemo<EphemeralAccountSwitcherContextValue>(
    () => ({
      hasAlternateAccounts,
      currentProfile,
      switcherAccounts,
      signOutPromptControl,
    }),
    [
      currentProfile,
      hasAlternateAccounts,
      signOutPromptControl,
      switcherAccounts,
    ],
  )

  return (
    <EphemeralAccountSwitcherContext.Provider value={contextValue}>
      {children}
    </EphemeralAccountSwitcherContext.Provider>
  )
}

export function EphemeralAccountSwitcherScope({
  selectedDid,
  currentProfileFromBatch = false,
  children,
}: {
  selectedDid: string
  currentProfileFromBatch?: boolean
  children: React.ReactNode
}) {
  const data = useEphemeralAccountSwitcherData(
    selectedDid,
    currentProfileFromBatch,
  )
  const signOutPromptControl = Prompt.usePromptControl()

  return (
    <EphemeralAccountSwitcherProvider
      data={data}
      signOutPromptControl={signOutPromptControl}>
      {children}
    </EphemeralAccountSwitcherProvider>
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
          <View {...(menuTriggerProps)}>
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

type EphemeralAccountSwitcherProps = {
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
}

export function EphemeralAccountSwitcher(
  props: EphemeralAccountSwitcherProps,
) {
  const data = useEphemeralAccountSwitcherData(props.selectedDid)
  return <EphemeralAccountSwitcherWithData {...props} data={data} />
}

export function EphemeralAccountSwitcherFromScope(
  props: EphemeralAccountSwitcherProps,
) {
  const data = useEphemeralAccountSwitcher()
  return (
    <EphemeralAccountSwitcherWithData
      {...props}
      data={data}
      useExistingScope
    />
  )
}

function EphemeralAccountSwitcherWithData({
  selectedDid,
  title,
  onSelectAccount,
  triggerBehavior = 'press',
  accounts: accountsOverride,
  resolveAccounts,
  renderTrigger,
  data,
  useExistingScope = false,
}: EphemeralAccountSwitcherProps & {
  data: EphemeralAccountSwitcherData
  useExistingScope?: boolean
}) {
  const {t: l} = useLingui()
  const {switcherAccounts, hasAlternateAccounts, currentProfile} =
    data
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
    const trigger = (
      <EphemeralAccountSwitcherMenu
        title={title}
        onSelectAccount={onSelectAccount}
        resolveAccounts={resolveAccounts}
        renderTrigger={renderTrigger}
      />
    )

    return useExistingScope ? (
      trigger
    ) : (
      <EphemeralAccountSwitcherProvider
        data={data}
        signOutPromptControl={signOutPromptControl}>
        {trigger}
      </EphemeralAccountSwitcherProvider>
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

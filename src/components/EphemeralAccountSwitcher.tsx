import {useMemo} from 'react'
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
import {IS_WEB_TOUCH_DEVICE} from '#/env'

type AccountListItem = {
  account: SessionAccount
  profile?: AppBskyActorDefs.ProfileViewDetailed
}

type SwitcherTriggerProps = {
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

export function EphemeralAccountSwitcher({
  selectedDid,
  title,
  onSelectAccount,
  triggerBehavior = 'press',
  renderTrigger,
}: {
  selectedDid: string
  title: string
  onSelectAccount: (account: SessionAccount) => void
  triggerBehavior?: 'press' | 'longPress'
  renderTrigger: (args: {
    currentProfile?: AppBskyActorDefs.ProfileViewDetailed
    triggerProps: SwitcherTriggerProps
  }) => React.ReactNode
}) {
  const {t: l} = useLingui()
  const {accounts} = useSession()
  const {data: currentProfile} = useProfileQuery({did: selectedDid})
  const {data} = useProfilesQuery({
    handles: accounts.map(acc => acc.did),
  })
  const control = useDialogControl()
  const menuControl = Menu.useMenuControl()
  const signOutPromptControl = Prompt.usePromptControl()
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
  const hasSwitcherAccounts = switcherAccounts.length > 0

  if (!hasSwitcherAccounts) {
    return renderTrigger({
      currentProfile,
      triggerProps: {
        ref: null,
        onPress: undefined,
        onLongPress: undefined,
        onFocus: () => {},
        onBlur: () => {},
        onPressIn: () => {},
        onPressOut: () => {},
        accessibilityLabel: l`Switch accounts`,
        accessibilityRole: 'button',
      },
    })
  }

  if (!IS_WEB_TOUCH_DEVICE && triggerBehavior === 'longPress') {
    return (
      <Menu.Root control={menuControl}>
        <Menu.Trigger label={l`Switch accounts`} role="none">
          {({props}) => (
            <View {...props}>
              {renderTrigger({
                currentProfile,
                triggerProps: {
                  ref: null,
                  onPress: undefined,
                  onLongPress: () => menuControl.open(),
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
          accounts={switcherAccounts}
          signOutPromptControl={signOutPromptControl}
          showExtraButtons={false}
          showAddAccount={false}
          title={title}
          onSelectAccount={onSelectAccount}
        />
      </Menu.Root>
    )
  }

  if (IS_WEB_TOUCH_DEVICE) {
    const openProps =
      triggerBehavior === 'longPress'
        ? {onPress: undefined, onLongPress: control.open}
        : {onPress: control.open, onLongPress: undefined}

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
          accounts={switcherAccounts.map(item => item.account)}
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
    <Menu.Root>
      <Menu.Trigger label={l`Switch accounts`}>
        {({props}) =>
          renderTrigger({
            currentProfile,
            triggerProps: props as SwitcherTriggerProps,
          })
        }
      </Menu.Trigger>
      <SwitchMenuItems
        accounts={switcherAccounts}
        signOutPromptControl={signOutPromptControl}
        showExtraButtons={false}
        showAddAccount={false}
        title={title}
        onSelectAccount={onSelectAccount}
      />
    </Menu.Root>
  )
}

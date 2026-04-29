import {useMemo} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {useProfileQuery, useProfilesQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {SwitchMenuItems} from '#/view/shell/desktop/LeftNav'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import * as Menu from '#/components/Menu'
import {type TriggerChildProps} from '#/components/Menu/types'
import * as Prompt from '#/components/Prompt'
import {IS_WEB_TOUCH_DEVICE} from '#/env'

type AccountListItem = {
  account: SessionAccount
  profile?: AppBskyActorDefs.ProfileViewDetailed
}

export function EphemeralAccountSwitcher({
  selectedDid,
  title,
  onSelectAccount,
  renderTrigger,
}: {
  selectedDid: string
  title: string
  onSelectAccount: (account: SessionAccount) => void
  renderTrigger: (args: {
    currentProfile?: AppBskyActorDefs.ProfileViewDetailed
    triggerProps: TriggerChildProps['props']
  }) => React.ReactNode
}) {
  const {t: l} = useLingui()
  const {accounts} = useSession()
  const {data: currentProfile} = useProfileQuery({did: selectedDid})
  const {data} = useProfilesQuery({
    handles: accounts.map(acc => acc.did),
  })
  const control = useDialogControl()
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

  if (IS_WEB_TOUCH_DEVICE) {
    return (
      <>
        {renderTrigger({
          currentProfile,
          triggerProps: {
            ref: null,
            onPress: control.open,
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
            triggerProps: props,
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

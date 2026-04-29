import {useCallback} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {AccountList} from '../AccountList'
import {Text} from '../Typography'

export function SwitchAccountDialog({
  control,
  accounts,
  title,
  pendingDid: pendingDidProp,
  selectedDid,
  otherLabel,
  showAddAccount = true,
  onSelectAccount: onSelectAccountProp,
  onSelectOther: onSelectOtherProp,
}: {
  control: Dialog.DialogControlProps
  accounts?: SessionAccount[]
  title?: string
  pendingDid?: string | null
  selectedDid?: string | null
  otherLabel?: string
  showAddAccount?: boolean
  onSelectAccount?: (account: SessionAccount) => void
  onSelectOther?: () => void
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onSelectAccount = useCallback(
    (account: SessionAccount) => {
      if (onSelectAccountProp) {
        control.close(() => {
          onSelectAccountProp(account)
        })
        return
      }
      if (account.did !== currentAccount?.did) {
        control.close(() => {
          onPressSwitchAccount(account, 'SwitchAccount')
        })
      } else {
        control.close()
      }
    },
    [control, currentAccount, onPressSwitchAccount, onSelectAccountProp],
  )

  const onPressAddAccount = useCallback(() => {
    if (onSelectOtherProp) {
      control.close(() => {
        onSelectOtherProp()
      })
      return
    }
    control.close(() => {
      setShowLoggedOut(true)
    })
  }, [control, onSelectOtherProp, setShowLoggedOut])

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Switch account`)}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            {title ?? <Trans>Switch account</Trans>}
          </Text>

          <AccountList
            accounts={accounts}
            onSelectAccount={onSelectAccount}
            onSelectOther={onPressAddAccount}
            otherLabel={otherLabel ?? _(msg`Add account`)}
            pendingDid={pendingDidProp ?? pendingDid}
            selectedDid={selectedDid}
            showAddAccount={showAddAccount}
          />
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

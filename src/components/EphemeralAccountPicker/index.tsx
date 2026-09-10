import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {type AccountPickerProps} from '#/components/EphemeralAccountPicker/types'

export {useDialogControl as useAccountPickerControl} from '#/components/Dialog'

export function EphemeralAccountPicker({
  control,
  request,
  accounts,
}: AccountPickerProps) {
  return (
    <SwitchAccountDialog
      control={control}
      accounts={accounts.map(item => item.account)}
      title={request?.title}
      pendingDid={null}
      showAddAccount={false}
      onSelectAccount={account => request?.onSelectAccount(account)}
    />
  )
}

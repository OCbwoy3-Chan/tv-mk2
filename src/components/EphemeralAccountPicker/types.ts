import {type SessionAccount} from '#/state/session'
import {type DialogControlProps} from '#/components/Dialog'
import {type app} from '#/lexicons'

export type AccountPickerRequest = {
  title: string
  onSelectAccount: (account: SessionAccount) => void
  /** The originating event target, used to anchor the shared web dropdown. */
  target?: unknown
  pointerHeld?: boolean
}

export type AccountPickerProps = {
  control: DialogControlProps
  request: AccountPickerRequest | null
  accounts: {
    account: SessionAccount
    profile?: app.bsky.actor.defs.ProfileViewDetailed
  }[]
  signOutPromptControl: DialogControlProps
}

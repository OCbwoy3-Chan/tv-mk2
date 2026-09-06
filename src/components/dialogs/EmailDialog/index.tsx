import {useCallback, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {type StatefulControl} from '#/components/dialogs/Context'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {useAccountEmailState} from '#/components/dialogs/EmailDialog/data/useAccountEmailState'
import {Manage2FA} from '#/components/dialogs/EmailDialog/screens/Manage2FA'
import {Update} from '#/components/dialogs/EmailDialog/screens/Update'
import {VerificationReminder} from '#/components/dialogs/EmailDialog/screens/VerificationReminder'
import {Verify} from '#/components/dialogs/EmailDialog/screens/Verify'
import {type Screen, ScreenID} from '#/components/dialogs/EmailDialog/types'
import {LegacyAuthRequiredDialogContent} from '#/components/dialogs/LegacyAuthRequiredDialog'
import {OAuthPermissionGate} from '#/components/dialogs/OAuthPermissionGate'

export type {Screen} from '#/components/dialogs/EmailDialog/types'
export {ScreenID as EmailDialogScreenID} from '#/components/dialogs/EmailDialog/types'

export function useEmailDialogControl() {
  return useGlobalDialogsControlContext().emailDialogControl
}

export function EmailDialog() {
  const {t: l} = useLingui()
  const emailDialogControl = useEmailDialogControl()
  const {isEmailVerified} = useAccountEmailState()
  const onClose = useCallback(() => {
    if (!isEmailVerified) {
      if (emailDialogControl.value?.id === ScreenID.Verify) {
        emailDialogControl.value.onCloseWithoutVerifying?.()
      }
    }
    emailDialogControl.clear()
  }, [isEmailVerified, emailDialogControl])

  return (
    <Dialog.Outer control={emailDialogControl.control} onClose={onClose}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Make adjustments to email settings for your account`}
        style={web({maxWidth: 400})}>
        <Inner control={emailDialogControl} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({control}: {control: StatefulControl<Screen>}) {
  const {currentAccount} = useSession()
  const [screen, showScreen] = useState(() => control.value)

  if (!screen) return null
  // The PDS disallows OAuth for email updates and login 2FA settings.
  if (
    currentAccount?.isOauthSession &&
    (screen.id === ScreenID.Update || screen.id === ScreenID.Manage2FA)
  ) {
    return <LegacyAuthRequiredDialogContent inline />
  }

  switch (screen.id) {
    case ScreenID.Update: {
      return <Update config={screen} showScreen={showScreen} />
    }
    case ScreenID.Verify: {
      return (
        <OAuthPermissionGate permission="email">
          <Verify config={screen} showScreen={showScreen} />
        </OAuthPermissionGate>
      )
    }
    case ScreenID.VerificationReminder: {
      return <VerificationReminder config={screen} showScreen={showScreen} />
    }
    case ScreenID.Manage2FA: {
      return <Manage2FA config={screen} showScreen={showScreen} />
    }
    default: {
      return null
    }
  }
}

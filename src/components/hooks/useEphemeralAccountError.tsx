import {useCallback} from 'react'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {type SessionAccount, useSessionApi} from '#/state/session'
import {isEphemeralAuthError} from '#/state/session/ephemeral-auth'
import * as Toast from '#/components/Toast'

export function useEphemeralAccountError() {
  const {t: l} = useLingui()
  const {reauthenticateAccount} = useSessionApi()
  return useCallback(
    (
      error: unknown,
      account: SessionAccount,
      retry?: (account: SessionAccount) => Promise<unknown>,
    ) => {
      if (!isEphemeralAuthError(error)) {
        Toast.show(l`An issue occurred, please try again.`, {type: 'error'})
        return
      }
      const login = async () => {
        try {
          const refreshed = await reauthenticateAccount(account)
          if (retry) await retry(refreshed)
        } catch (e) {
          Toast.show(cleanError(e), {type: 'error'})
        }
      }
      Toast.show(
        <Toast.Outer>
          <Toast.Icon />
          <Toast.Text>
            <Trans>Please sign in as @{account.handle} to continue.</Trans>
          </Toast.Text>
          <Toast.Action label={l`Login`} onPress={() => void login()}>
            <Trans>Login</Trans>
          </Toast.Action>
        </Toast.Outer>,
        {type: 'error', duration: 15000},
      )
    },
    [l, reauthenticateAccount],
  )
}

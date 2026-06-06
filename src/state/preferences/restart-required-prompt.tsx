import {useCallback} from 'react'

import {useLingui} from '@lingui/react/macro'
import {reloadAppAsync} from 'expo'

import {usePrepareSettingsSyncForRestart} from '#/features/settingsSync'
import {IS_WEB} from '#/env'
import * as Prompt from '#/components/Prompt'

export function RestartRequiredPrompt({
  control,
  onConfirm,
}: {
  control: Prompt.PromptControlProps
  onConfirm?: () => void
}) {
  const {t: l} = useLingui()
  const prepareSettingsSyncForRestart = usePrepareSettingsSyncForRestart()

  const handleConfirm = useCallback(async () => {
    onConfirm?.()

    await prepareSettingsSyncForRestart()

    if (IS_WEB) {
      window.location.reload()
    } else {
      await reloadAppAsync()
    }
  }, [onConfirm, prepareSettingsSyncForRestart])

  return (
    <Prompt.Basic
      control={control}
      title={l`Restart required`}
      description={l`Restart the app for this change to take effect.`}
      cancelButtonCta={l`Cancel`}
      confirmButtonCta={l`Restart`}
      onConfirm={handleConfirm}
    />
  )
}
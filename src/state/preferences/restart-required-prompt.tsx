import {useCallback} from 'react'

import {useLingui} from '@lingui/react/macro'
import {reloadAppAsync} from 'expo'

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

  const handleConfirm = useCallback(() => {
    onConfirm?.()

    if (IS_WEB) {
      window.location.reload()
    } else {
      void reloadAppAsync()
    }
  }, [onConfirm])

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
import {useState} from 'react'
import {reloadAppAsync} from 'expo'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {clearPersistedQueryStorage} from '#/lib/persisted-query-storage'
import {purgeTemporaryImageFiles} from '#/state/gallery'
import {clearPdsLabelCache} from '#/state/queries/pds-label-resolver'
import {useSession} from '#/state/session'
import {Button, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {IS_NATIVE, IS_WEB} from '#/env'
import {usePrepareSettingsSyncForRestart} from '#/features/settingsSync'

export function ClearCachesButton() {
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const {accounts} = useSession()
  const prepareForRestart = usePrepareSettingsSyncForRestart()
  const [isClearing, setIsClearing] = useState(false)

  async function onPress() {
    setIsClearing(true)
    try {
      await prepareForRestart()
      await queryClient.cancelQueries()
      queryClient.clear()
      await Promise.all([
        clearPdsLabelCache(),
        purgeTemporaryImageFiles(),
        ...['logged-out', ...accounts.map(account => account.did)].map(
          clearPersistedQueryStorage,
        ),
        ...(IS_NATIVE ? [Image.clearMemoryCache(), Image.clearDiskCache()] : []),
        ...(IS_WEB && typeof caches !== 'undefined'
          ? [
              caches.keys().then(keys =>
                Promise.all(keys.map(key => caches.delete(key))),
              ),
            ]
          : []),
      ])
      // Restart also drops module-level caches and mounted image state.
      if (IS_WEB) {
        window.location.reload()
      } else {
        await reloadAppAsync()
      }
    } catch {
      Toast.show(l`Unable to clear caches. Please try again.`, {type: 'error'})
      setIsClearing(false)
    }
  }

  return (
    <Button
      testID="clearCachesButton"
      label={l`Clear caches and restart`}
      color="secondary"
      size="small"
      disabled={isClearing}
      onPress={onPress}>
      {isClearing && <Loader size="sm" />}
      <ButtonText>
        <Trans>Clear caches and restart</Trans>
      </ButtonText>
    </Button>
  )
}

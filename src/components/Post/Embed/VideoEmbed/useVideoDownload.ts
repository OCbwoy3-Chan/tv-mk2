import {isDid} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {saveVideoToDevice} from '#/lib/media/saveVideoToDevice'
import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import * as Toast from '#/components/Toast'

export function useVideoDownload({
  did,
  cid,
}: {
  did: string | undefined
  cid: string
}) {
  const {t: l} = useLingui()

  if (!did || !isDid(did)) return undefined

  return () => {
    void (async () => {
      Toast.show(l({message: 'Downloading video...', context: 'toast'}))

      try {
        const pdsUrl = await resolvePdsServiceUrl(did)
        const uri = `${pdsUrl}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`
        const success = await saveVideoToDevice({uri})

        Toast.show(
          success
            ? l({message: 'Video downloaded', context: 'toast'})
            : l({message: 'Failed to download video', context: 'toast'}),
          {type: success ? 'success' : 'error'},
        )
      } catch {
        Toast.show(l({message: 'Failed to download video', context: 'toast'}), {
          type: 'error',
        })
      }
    })()
  }
}

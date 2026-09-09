import {type Did} from '@atproto/api'
import {type Client, getBlobCidString} from '@atproto/lex'
import {type I18n} from '@lingui/core'

import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {processVideo, type VideoState} from './video'

/** Keep every blob in a video embed in the repository that will publish it. */
export async function prepareVideoForAccount(
  video: Extract<VideoState, {status: 'done'}>,
  client: Client,
  dispatchUrl: string | URL,
  fallbackOwnerDid: string,
  i18n: I18n,
): Promise<Extract<VideoState, {status: 'done'}>> {
  const ownerDid = video.pendingPublish.ownerDid ?? fallbackOwnerDid
  if (ownerDid === client.assertDid) return video

  let blobRef = video.pendingPublish.blobRef
  if (video.asset) {
    // Unpublished blobs aren't reliably available through sync.getBlob.
    let uploaded = false
    let uploadError: string | undefined
    await processVideo(
      video.asset,
      action => {
        if (action.type === 'to_error') uploadError = action.error
        if (action.type === 'to_done') {
          blobRef = action.blobRef
          uploaded = true
        }
      },
      client,
      dispatchUrl,
      video.abortController.signal,
      i18n,
      video.telemetry,
    )
    if (uploadError) throw new Error(uploadError)
    if (!uploaded) throw new Error('Video upload was cancelled')
  } else {
    blobRef = await copyPublishedBlob(blobRef)
  }

  const originalCaptions =
    'originalCaptions' in video
      ? await Promise.all(
          (video.originalCaptions ?? []).map(async caption => ({
            ...caption,
            file: await copyPublishedBlob(caption.file),
          })),
        )
      : undefined
  return {
    ...video,
    ...('originalCaptions' in video ? {originalCaptions} : {}),
    pendingPublish: {blobRef, ownerDid: client.assertDid},
  }

  async function copyPublishedBlob(blob: typeof blobRef) {
    const pdsUrl = await resolvePdsServiceUrl(ownerDid as Did)
    const url = new URL('/xrpc/com.atproto.sync.getBlob', pdsUrl)
    url.searchParams.set('did', ownerDid)
    url.searchParams.set('cid', getBlobCidString(blob))
    const response = await fetch(url)
    if (!response.ok)
      throw new Error('Could not load original video or captions')
    return (
      await client.uploadBlob(new Uint8Array(await response.arrayBuffer()), {
        encoding: blob.mimeType as `${string}/${string}`,
      })
    ).body.blob
  }
}

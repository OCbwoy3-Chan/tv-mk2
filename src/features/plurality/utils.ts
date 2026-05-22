import {type BlobRef} from '@atproto/api'

export function pluralMemberBlobUrl({
  pdsUrl,
  did,
  blob,
}: {
  pdsUrl: string
  did: string
  blob: BlobRef
}): string | undefined {
  const cid = getBlobCid(blob)
  if (!cid) return undefined

  const cleanedPds = pdsUrl.endsWith('/') ? pdsUrl.slice(0, -1) : pdsUrl
  return `${cleanedPds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`
}

function getBlobCid(blob: BlobRef): string | undefined {
  if ('cid' in blob && typeof blob.cid === 'string') {
    return blob.cid
  }
  const ref = blob.ref
  if (ref && typeof ref === 'object' && '$link' in ref && typeof ref.$link === 'string') {
    return ref.$link
  }
  return undefined
}

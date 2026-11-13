/** Recognizes private-post wrappers without accepting lookalike hosts. */
export function parsePrivatePostLink(uri: string) {
  try {
    const url = new URL(uri)
    if (url.origin !== 'https://private-post.tenna.party' || url.pathname !== '/') return
    const recordUri = url.searchParams.get('uri')
    const cid = url.searchParams.get('cid')
    if (!recordUri || !cid) return
    return {uri: recordUri, cid}
  } catch {
    return
  }
}

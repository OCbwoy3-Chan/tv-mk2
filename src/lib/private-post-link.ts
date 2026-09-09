/** Recognizes private-post wrappers without accepting lookalike hosts. */
export function parsePrivatePostLink(uri: string) {
  try {
    const url = new URL(uri)
    if (url.origin !== 'https://private-post.tenna.party' || url.pathname !== '/') return
    return {uri: url.searchParams.get('uri') ?? '', cid: url.searchParams.get('cid') ?? ''}
  } catch {
    return
  }
}

import {useQuery} from '@tanstack/react-query'

import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'

const BSKY_PDS_HOSTNAMES = ['bsky.social', 'staging.bsky.dev']
const BSKY_PDS_SUFFIX = '.bsky.network'
const BRIDGY_FED_HOSTNAME = 'atproto.brid.gy'

export function isBskyPdsUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return (
      BSKY_PDS_HOSTNAMES.includes(hostname) ||
      hostname.endsWith(BSKY_PDS_SUFFIX)
    )
  } catch {
    return false
  }
}

export function isBridgedPdsUrl(url: string): boolean {
  try {
    return new URL(url).hostname === BRIDGY_FED_HOSTNAME
  } catch {
    return false
  }
}

async function fetchFaviconUrl(pdsUrl: string): Promise<string> {
  let origin = ''
  try {
    origin = new URL(pdsUrl).origin
  } catch {
    return ''
  }
  try {
    const res = await fetch(origin, {headers: {Accept: 'text/html'}})
    if (res.ok) {
      const html = await res.text()
      // Match <link rel="icon"> or <link rel="shortcut icon"> in either attribute order
      const match =
        html.match(
          /<link[^>]+rel=["'][^"']*\bicon\b[^"']*["'][^>]*href=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*\bicon\b[^"']*["']/i,
        )
      if (match) {
        const href = match[1]
        if (href.startsWith('http')) return href
        if (href.startsWith('//')) return `https:${href}`
        if (href.startsWith('/')) return `${origin}${href}`
        return `${origin}/${href}`
      }
    }
  } catch {}
  return `${origin}/favicon.ico`
}

export const RQKEY_ROOT = 'pds-label'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function usePdsLabelQuery(did: string | undefined) {
  return useQuery({
    queryKey: RQKEY(did ?? ''),
    queryFn: async () => {
      if (!did) return null
      const pdsUrl = await resolvePdsServiceUrl(did as `did:${string}`)
      const isBsky = isBskyPdsUrl(pdsUrl)
      const isBridged = isBridgedPdsUrl(pdsUrl)
      const faviconUrl =
        isBsky || isBridged ? '' : await fetchFaviconUrl(pdsUrl)
      return {pdsUrl, isBsky, isBridged, faviconUrl}
    },
    enabled: !!did,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

import {useQuery} from '@tanstack/react-query'

import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {IS_WEB} from '#/env'

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

async function fetchFaviconUrl(pdsUrl: string): Promise<string | undefined> {
  let origin = ''
  try {
    origin = new URL(pdsUrl).origin
  } catch {
    return undefined
  }

  if (IS_WEB) {
    // fetch() is blocked by CORS for third-party origins on web.
    // Use the browser Image constructor instead — it loads cross-origin without CORS.
    // Only resolve with the URL once the image confirms it loaded.
    return new Promise<string | undefined>(resolve => {
      const url = `${origin}/favicon.ico`
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => resolve(undefined)
      img.src = url
    })
  }

  const [linkIconUrl, faviconIcoUrl] = await Promise.all([
    fetch(origin, {headers: {Accept: 'text/html'}})
      .then(async res => {
        if (!res.ok) return undefined
        const html = await res.text()
        // Match <link rel="icon"> or <link rel="shortcut icon"> in either attribute order
        const match =
          html.match(
            /<link[^>]+rel=["'][^"']*\bicon\b[^"']*["'][^>]*href=["']([^"']+)["']/i,
          ) ||
          html.match(
            /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*\bicon\b[^"']*["']/i,
          )
        if (!match) return undefined
        const href = match[1]
        if (href.startsWith('http')) return href
        if (href.startsWith('//')) return `https:${href}`
        if (href.startsWith('/')) return `${origin}${href}`
        return `${origin}/${href}`
      })
      .catch(() => undefined),
    fetch(`${origin}/favicon.ico`)
      .then(res => (res.ok ? `${origin}/favicon.ico` : undefined))
      .catch(() => undefined),
  ])

  return faviconIcoUrl ?? linkIconUrl
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
      return {pdsUrl, isBsky, isBridged}
    },
    enabled: !!did,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export const RQKEY_FAVICON_ROOT = 'pds-favicon'
export const RQKEY_FAVICON = (pdsUrl: string) => [RQKEY_FAVICON_ROOT, pdsUrl]

export function usePdsFaviconQuery(pdsUrl: string | undefined) {
  return useQuery({
    queryKey: RQKEY_FAVICON(pdsUrl ?? ''),
    queryFn: async () => {
      if (!pdsUrl) return undefined
      return await fetchFaviconUrl(pdsUrl)
    },
    enabled: !!pdsUrl,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

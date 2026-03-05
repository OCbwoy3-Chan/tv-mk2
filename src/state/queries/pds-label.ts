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

// Ordered from highest to lowest quality. The web path probes these via Image
// (CORS-safe) and returns the first that successfully loads. The native path
// uses these as a fallback chain when no <link> icon is found in the HTML.
const ICON_CANDIDATE_PATHS = [
  '/apple-touch-icon.png', // 180 × 180, very common
  '/apple-icon-180x180.png',
  '/favicon-256x256.png',
  '/favicon-96x96.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.ico',
]

/** Returns the pixel size for a `sizes` attribute value like "180x180", or 0. */
function parseSizeAttr(sizes: string | null | undefined): number {
  if (!sizes) return 0
  const match = sizes.match(/(\d+)x\d+/i)
  return match ? parseInt(match[1], 10) : 0
}

/** Resolves an href found in a <link> tag to an absolute URL. */
function resolveHref(href: string, origin: string): string {
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return `https:${href}`
  if (href.startsWith('/')) return `${origin}${href}`
  return `${origin}/${href}`
}

async function getFaviconUrl(pdsUrl: string): Promise<string | undefined> {
  let origin = ''
  try {
    origin = new URL(pdsUrl).origin
  } catch {
    return undefined
  }

  if (IS_WEB) {
    // fetch() is blocked by CORS for third-party origins on web.
    // Probe candidate URLs in parallel using the Image constructor (CORS-safe).
    // Return whichever high-quality candidate loads first, in priority order.
    const results = await Promise.all(
      ICON_CANDIDATE_PATHS.map(
        path =>
          new Promise<string | undefined>(resolve => {
            const url = `${origin}${path}`
            const img = new Image()
            img.onload = () => resolve(url)
            img.onerror = () => resolve(undefined)
            img.src = url
          }),
      ),
    )
    // Return the first (highest-priority) candidate that loaded.
    return results.find(Boolean)
  }

  // Native path: parse the page HTML for all <link rel="icon"> / <link
  // rel="apple-touch-icon"> tags, pick the one with the largest declared size,
  // then fall back to probing the candidate paths in order.
  const htmlIconUrl = await fetch(origin, {headers: {Accept: 'text/html'}})
    .then(async res => {
      if (!res.ok) return undefined
      const html = await res.text()

      // Collect every <link> tag that looks like an icon.
      const linkTagRe = /<link([^>]+)>/gi
      let best: {url: string; size: number} | undefined

      let tagMatch: RegExpExecArray | null
      while ((tagMatch = linkTagRe.exec(html)) !== null) {
        const attrs = tagMatch[1]
        const relMatch = attrs.match(/rel=["']([^"']+)["']/i)
        if (!relMatch) continue
        const rel = relMatch[1].toLowerCase()
        if (!rel.includes('icon')) continue

        const hrefMatch =
          attrs.match(/href=["']([^"']+)["']/i) ||
          attrs.match(/href=([^\s>]+)/i)
        if (!hrefMatch) continue

        const sizesMatch = attrs.match(/sizes=["']([^"']+)["']/i)
        const size = parseSizeAttr(sizesMatch?.[1])
        const url = resolveHref(hrefMatch[1], origin)

        // apple-touch-icon gets a size bonus so it beats a generic icon of the
        // same declared dimensions.
        const effectiveSize = rel.includes('apple-touch-icon') ? size + 1 : size

        if (!best || effectiveSize > best.size) {
          best = {url, size: effectiveSize}
        }
      }

      return best?.url
    })
    .catch(() => undefined)

  if (htmlIconUrl) return htmlIconUrl

  // Fall back to probing known high-quality paths in order.
  for (const path of ICON_CANDIDATE_PATHS) {
    const url = `${origin}${path}`
    const ok = await fetch(url, {method: 'HEAD'})
      .then(res => res.ok)
      .catch(() => false)
    if (ok) return url
  }

  try {
    const hostname = new URL(pdsUrl).hostname
    return `https://favicon.im/${hostname}?throw-error-on-404=true`
  } catch {
    return undefined
  }
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
      return await getFaviconUrl(pdsUrl)
    },
    enabled: !!pdsUrl,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

import {useCallback} from 'react'
import {isDid} from '@atproto/api'

import {
  PUBLIC_APPVIEW_DID,
  PUBLIC_BSKY_SERVICE,
} from '#/lib/constants'
import {device, useStorage} from '#/storage'

export type AppViewPresetId = 'bluesky' | 'blacksky' | 'custom'

export type AppViewPreset = {
  id: AppViewPresetId
  /**
   * Display title shown on the App server control.
   */
  title: string
  /**
   * AppView service URL used for guest browsing and as the preset's identity.
   */
  url: string
  /**
   * DID used for `atproto-proxy` (`#bsky_appview`). `undefined` means the
   * build/runtime default (Bluesky).
   */
  did: string | undefined
}

/**
 * Named AppView presets offered on the sign-in screen. Bluesky clears any
 * override so the build defaults apply; Blacksky points at their public
 * AppView DID/URL.
 */
export const APPVIEW_PRESETS: Record<
  Exclude<AppViewPresetId, 'custom'>,
  AppViewPreset
> = {
  bluesky: {
    id: 'bluesky',
    title: 'Bluesky',
    url: PUBLIC_BSKY_SERVICE,
    did: undefined,
  },
  blacksky: {
    id: 'blacksky',
    title: 'Blacksky',
    url: 'https://api.blacksky.community',
    did: 'did:web:api.blacksky.community',
  },
}

export function useCustomAppViewDid() {
  const [customAppViewDid = undefined, setCustomAppViewDid] = useStorage(
    device,
    ['customAppViewDid'],
  )

  return [customAppViewDid, setCustomAppViewDid] as const
}

export function useCustomAppViewUrl() {
  const [customAppViewUrl = undefined, setCustomAppViewUrl] = useStorage(
    device,
    ['customAppViewUrl'],
  )

  return [customAppViewUrl, setCustomAppViewUrl] as const
}

export function useSetCustomAppViewDid() {
  const [, setCustomAppViewDid] = useCustomAppViewDid()

  return useCallback(
    (customAppViewDid: string | undefined) => {
      setCustomAppViewDid(customAppViewDid)
    },
    [setCustomAppViewDid],
  )
}

/**
 * Persist a selected AppView. Clears both fields for the Bluesky default;
 * otherwise stores the proxy DID and (for guest browsing) the service URL.
 */
export function useSetAppViewSelection() {
  const [, setCustomAppViewDid] = useCustomAppViewDid()
  const [, setCustomAppViewUrl] = useCustomAppViewUrl()

  return useCallback(
    (selection: {did: string | undefined; url: string | undefined}) => {
      setCustomAppViewDid(selection.did)
      setCustomAppViewUrl(selection.url)
    },
    [setCustomAppViewDid, setCustomAppViewUrl],
  )
}

export function readCustomAppViewDidUri() {
  const maybeDid = device.get(['customAppViewDid'])
  if (!maybeDid || !isDid(maybeDid)) {
    return undefined
  }

  return `${maybeDid}#bsky_appview`
}

/**
 * Guest-agent service URL override. Falls back to `PUBLIC_BSKY_SERVICE` when
 * unset (Bluesky default).
 */
export function readCustomAppViewUrl() {
  return device.get(['customAppViewUrl']) || undefined
}

/**
 * Resolve the active preset from stored DID/URL for UI defaults.
 */
export function getActiveAppViewPreset(
  did: string | undefined,
  url: string | undefined,
): AppViewPresetId {
  if (!did && !url) {
    return 'bluesky'
  }

  const normalizedUrl = normalizeAppViewUrl(url)
  if (
    did === APPVIEW_PRESETS.blacksky.did ||
    normalizedUrl === normalizeAppViewUrl(APPVIEW_PRESETS.blacksky.url)
  ) {
    return 'blacksky'
  }

  if (
    (!did || did === PUBLIC_APPVIEW_DID) &&
    (!normalizedUrl ||
      normalizedUrl === normalizeAppViewUrl(APPVIEW_PRESETS.bluesky.url))
  ) {
    return 'bluesky'
  }

  return 'custom'
}

/**
 * Human-readable title for the active AppView selection.
 */
export function getActiveAppViewTitle(
  did: string | undefined,
  url: string | undefined,
): string {
  const preset = getActiveAppViewPreset(did, url)
  if (preset === 'bluesky') {
    return APPVIEW_PRESETS.bluesky.title
  }
  if (preset === 'blacksky') {
    return APPVIEW_PRESETS.blacksky.title
  }
  if (url) {
    try {
      return new URL(normalizeAppViewUrl(url)).host
    } catch {
      return url
    }
  }
  if (did) {
    return did.replace(/^did:web:/, '')
  }
  return APPVIEW_PRESETS.bluesky.title
}

/**
 * Normalize a typed AppView URL: trim, lowercase host path, add https when
 * missing. Localhost keeps http.
 */
export function normalizeAppViewUrl(url: string | undefined): string {
  if (!url) return ''
  let next = url.trim()
  if (!next) return ''
  if (!next.startsWith('http://') && !next.startsWith('https://')) {
    if (next === 'localhost' || next.startsWith('localhost:')) {
      next = `http://${next}`
    } else {
      next = `https://${next}`
    }
  }
  try {
    const parsed = new URL(next)
    // Drop trailing slash for stable comparisons / storage.
    return parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname)
  } catch {
    return next
  }
}

/**
 * Derive a did:web from an AppView URL hostname (e.g.
 * `https://api.example.com` → `did:web:api.example.com`).
 */
export function didWebFromAppViewUrl(url: string): string | undefined {
  try {
    const host = new URL(normalizeAppViewUrl(url)).host
    if (!host) return undefined
    return `did:web:${host}`
  } catch {
    return undefined
  }
}

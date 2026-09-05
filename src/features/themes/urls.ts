import {BSKY_APP_HOST} from '#/lib/strings/url-helpers'
import {IS_WEB} from '#/env'

export function parseThemeUrl(uri: string) {
  try {
    const url = new URL(uri)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return
    const match = url.pathname.match(/^\/profile\/([^/]+)\/theme\/([^/]+)\/?$/)
    if (!match) return
    return {
      name: decodeURIComponent(match[1]),
      rkey: decodeURIComponent(match[2]),
    }
  } catch {
    return
  }
}

export function themeShareUrl(name: string, rkey: string) {
  const origin = IS_WEB ? window.location.origin : BSKY_APP_HOST
  return new URL(`/profile/${name}/theme/${rkey}`, origin).toString()
}

import {AtUri} from '@atproto/api'

import {THEME_COLLECTION} from '#/features/themes/types'
import {parseThemeUrl} from '#/features/themes/urls'

/** Converts a theme link or AT URI to a DID-based record URI for storage. */
export async function resolveThemeReference(
  value: string,
  resolveHandle: (handle: string) => Promise<string>,
): Promise<string | undefined> {
  const input = value.trim()
  if (!input) return undefined
  const link = parseThemeUrl(input)
  const uri = new AtUri(
    link ? `at://${link.name}/${THEME_COLLECTION}/${link.rkey}` : input,
  )
  if (uri.collection !== THEME_COLLECTION || !uri.rkey) {
    throw new Error('Invalid theme reference')
  }
  const repo = uri.hostname.startsWith('did:')
    ? uri.hostname
    : await resolveHandle(uri.hostname)
  return `at://${repo}/${THEME_COLLECTION}/${uri.rkey}`
}

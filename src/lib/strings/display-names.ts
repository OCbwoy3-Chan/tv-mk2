import {type ModerationUI} from '@atproto/api'

import {sanitizeHandle} from '#/lib/strings/handles'

// \u2705 = ✅
// \u2713 = ✓
// \u2714 = ✔
// \u2611 = ☑
const CHECK_MARKS_RE = /[\u2705\u2713\u2714\u2611]/gu
const CONTROL_CHARS_RE =
  /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g
const MULTIPLE_SPACES_RE = /[\s][\s\u200B]+/g

export function sanitizeDisplayName(
  str: string,
  moderation?: ModerationUI,
): string {
  if (moderation?.blur) {
    return ''
  }
  if (typeof str === 'string') {
    return str
      .replace(CHECK_MARKS_RE, '')
      .replace(CONTROL_CHARS_RE, '')
      .replace(MULTIPLE_SPACES_RE, ' ')
      .trim()
  }
  return ''
}

/**
 * Primary identity label for an author. When hideDisplayNames is on, returns
 * the bare handle (e.g. alice.bsky.social) instead of a custom display name.
 */
export function getAuthorPrimaryName(
  author: {displayName?: string; handle: string},
  opts?: {
    hideDisplayNames?: boolean
    moderation?: ModerationUI
  },
): string {
  if (opts?.hideDisplayNames) {
    return sanitizeHandle(author.handle)
  }
  return sanitizeDisplayName(
    author.displayName || sanitizeHandle(author.handle),
    opts?.moderation,
  )
}

export function combinedDisplayName({
  handle,
  displayName,
  hideDisplayNames,
}: {
  handle?: string
  displayName?: string
  hideDisplayNames?: boolean
}): string {
  if (!handle) {
    return ''
  }
  if (hideDisplayNames) {
    return sanitizeHandle(handle)
  }
  return displayName
    ? `${sanitizeDisplayName(displayName)} (@${handle})`
    : `@${handle}`
}

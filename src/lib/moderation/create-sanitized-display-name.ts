import {type ModerationUI} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import type * as bsky from '#/types/bsky'

export function createSanitizedDisplayName(
  profile: bsky.profile.AnyProfileView,
  noAt = false,
  moderation?: ModerationUI,
  hideDisplayNames = false,
) {
  if (
    !hideDisplayNames &&
    profile.displayName != null &&
    profile.displayName !== ''
  ) {
    return sanitizeDisplayName(profile.displayName, moderation)
  } else {
    return sanitizeHandle(profile.handle, noAt || hideDisplayNames ? '' : '@')
  }
}

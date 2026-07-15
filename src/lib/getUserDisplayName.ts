import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function getUserDisplayName<
  T extends {displayName?: string; handle: string; [key: string]: any},
>(props: T, hideDisplayNames = false): string {
  if (hideDisplayNames) {
    return sanitizeHandle(props.handle)
  }
  return sanitizeDisplayName(
    props.displayName || sanitizeHandle(props.handle, '@'),
  )
}

export type ThreadShortcut =
  | 'add-post'
  | 'move-post-up'
  | 'move-post-down'
  | 'focus-post-up'
  | 'focus-post-down'

type ShortcutAvailability = {
  canAddPost: boolean
  canMovePostUp: boolean
  canMovePostDown: boolean
}

export function getThreadShortcut(
  event: {
    altKey: boolean
    shiftKey?: boolean
    ctrlKey?: boolean
    metaKey?: boolean
    code: string
  },
  availability: ShortcutAvailability,
): ThreadShortcut | undefined {
  if (!event.altKey || event.ctrlKey || event.metaKey) return undefined
  if (event.code === 'Enter' && availability.canAddPost) return 'add-post'
  if (event.code === 'ArrowUp' && availability.canMovePostUp) {
    return event.shiftKey ? 'move-post-up' : 'focus-post-up'
  }
  if (event.code === 'ArrowDown' && availability.canMovePostDown) {
    return event.shiftKey ? 'move-post-down' : 'focus-post-down'
  }
  return undefined
}

/** Backspace may dismiss an empty composition, but must never discard siblings. */
export function getEmptyPostBackspaceAction({
  hasContent,
  isFirstPost,
  canRemovePost,
  canCloseComposer,
}: {
  hasContent: boolean
  isFirstPost: boolean
  canRemovePost: boolean
  canCloseComposer: boolean
}): 'close-composer' | 'remove-post' | undefined {
  if (hasContent) return undefined
  if (!canRemovePost) return canCloseComposer ? 'close-composer' : undefined
  return isFirstPost ? undefined : 'remove-post'
}

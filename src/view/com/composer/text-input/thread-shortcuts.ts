export type ThreadShortcut = 'add-post' | 'move-post-up' | 'move-post-down'

type ShortcutAvailability = {
  canAddPost: boolean
  canMovePostUp: boolean
  canMovePostDown: boolean
}

export function getThreadShortcut(
  event: {altKey: boolean; code: string},
  availability: ShortcutAvailability,
): ThreadShortcut | undefined {
  if (!event.altKey) return undefined
  if (event.code === 'Enter' && availability.canAddPost) return 'add-post'
  if (event.code === 'ArrowUp' && availability.canMovePostUp) {
    return 'move-post-up'
  }
  if (event.code === 'ArrowDown' && availability.canMovePostDown) {
    return 'move-post-down'
  }
  return undefined
}

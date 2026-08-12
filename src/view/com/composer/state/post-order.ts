export function moveItem<T extends {id: string}>(
  items: T[],
  itemId: string,
  direction: 'up' | 'down',
): T[] | undefined {
  const itemIndex = items.findIndex(item => item.id === itemId)
  const nextItemIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1
  if (itemIndex === -1 || nextItemIndex < 0 || nextItemIndex >= items.length) {
    return undefined
  }

  const nextItems = [...items]
  ;[nextItems[itemIndex], nextItems[nextItemIndex]] = [
    nextItems[nextItemIndex],
    nextItems[itemIndex],
  ]
  return nextItems
}

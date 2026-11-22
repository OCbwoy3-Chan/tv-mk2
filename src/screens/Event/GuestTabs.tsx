import {useEffect} from 'react'
import {useSharedValue, withTiming} from 'react-native-reanimated'

import {TabBar} from '#/view/com/pager/TabBar'

/**
 * The app's tab bar without a pager: the list below swaps its data instead of
 * paging. The native bar moves its underline with `dragProgress`, which a
 * pager would drive while swiping, so it is animated here on selection.
 */
export function GuestTabs({
  items,
  selected,
  onSelect,
}: {
  items: string[]
  selected: number
  onSelect: (index: number) => void
}) {
  const dragProgress = useSharedValue(selected)
  const dragState = useSharedValue<'idle' | 'dragging' | 'settling'>('idle')

  useEffect(() => {
    dragProgress.set(withTiming(selected, {duration: 200}))
  }, [selected, dragProgress])

  return (
    <TabBar
      testID="eventGuestTabs"
      items={items}
      selectedPage={selected}
      onSelect={onSelect}
      dragProgress={dragProgress}
      dragState={dragState}
    />
  )
}

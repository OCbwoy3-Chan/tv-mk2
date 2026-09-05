import {useCallback, useSyncExternalStore} from 'react'

import * as persisted from '#/state/persisted'

type Key = 'tabTitleSource' | 'notificationsBadgeText' | 'chatsBadgeText'

export function useBadgePreference<K extends Key>(key: K) {
  const subscribe = useCallback(
    (notify: () => void) => persisted.onUpdate(key, notify),
    [key],
  )
  const getSnapshot = useCallback(() => persisted.get(key), [key])
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const setValue = useCallback(
    (next: persisted.Schema[K]) => {
      void persisted.write(key, next)
    },
    [key],
  )
  return [value, setValue] as const
}

export function badgeText(count: string | undefined, text: string | undefined) {
  return count ? text?.trim() || count : undefined
}

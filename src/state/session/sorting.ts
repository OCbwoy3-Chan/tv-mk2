import {useMemo} from 'react'

import {device, useStorage} from '#/storage'
import {type SessionAccount} from './types'

export type AccountSortOption =
  | 'alphabetical'
  | 'dateModified'
  | 'dateAdded'
  | 'custom'

type SortableAccountItem = {
  account: Pick<SessionAccount, 'handle' | 'addedAt' | 'lastActiveAt'>
}

function getSortableAccount(
  item: SessionAccount | SortableAccountItem,
): Pick<SessionAccount, 'handle' | 'addedAt' | 'lastActiveAt'> {
  return 'account' in item ? item.account : item
}

export function sortAccountItems<
  T extends SessionAccount | SortableAccountItem,
>(accounts: T[], sortBy: AccountSortOption, reverse: boolean) {
  const next = [...accounts]
  if (sortBy === 'alphabetical') {
    next.sort((a, b) =>
      getSortableAccount(a).handle.localeCompare(
        getSortableAccount(b).handle,
        undefined,
        {
          sensitivity: 'base',
        },
      ),
    )
  } else if (sortBy === 'dateModified') {
    next.sort((a, b) => {
      const left = Date.parse(getSortableAccount(a).lastActiveAt ?? '') || 0
      const right = Date.parse(getSortableAccount(b).lastActiveAt ?? '') || 0
      return right - left
    })
  } else if (sortBy === 'dateAdded') {
    next.sort((a, b) => {
      const left = Date.parse(getSortableAccount(a).addedAt ?? '') || 0
      const right = Date.parse(getSortableAccount(b).addedAt ?? '') || 0
      return right - left
    })
  }
  if (reverse) {
    next.reverse()
  }
  return next
}

export function useAccountSwitcherSortSettings() {
  const [storedSortBy, setStoredSortBy] = useStorage(device, [
    'settingsAccountSwitcherSortBy',
  ])
  const [reverseAccounts = false, setReverseAccounts] = useStorage(device, [
    'settingsAccountSwitcherReverse',
  ])

  return {
    sortBy: storedSortBy ?? ('dateModified' as AccountSortOption),
    setSortBy: setStoredSortBy,
    reverse: reverseAccounts,
    setReverse: setReverseAccounts,
  }
}

export function useSortedAccountItems<
  T extends SessionAccount | SortableAccountItem,
>(accounts: T[]) {
  const {sortBy, reverse} = useAccountSwitcherSortSettings()

  return useMemo(
    () => sortAccountItems(accounts, sortBy, reverse),
    [accounts, sortBy, reverse],
  )
}

import {useMemo} from 'react'

import {device, useStorage} from '#/storage'

export function useHiddenAccountsElsewhere() {
  const [hiddenAccountsElsewhere = [], setHiddenAccountsElsewhere] = useStorage(
    device,
    ['hiddenAccountsElsewhere'],
  )

  const hiddenDidsSet = useMemo(
    () => new Set(hiddenAccountsElsewhere),
    [hiddenAccountsElsewhere],
  )

  return [
    hiddenAccountsElsewhere,
    setHiddenAccountsElsewhere,
    hiddenDidsSet,
  ] as const
}

import {useMemo} from 'react'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

const noopScope = () => {}

export function useHotkeysContext() {
  return useMemo(() => ({enableScope: noopScope, disableScope: noopScope}), [])
}

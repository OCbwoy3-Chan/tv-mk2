import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.alsoLikedCollapseByDefault),
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('alsoLikedCollapseByDefault')),
  )

  const setStateWrapped = useCallback(
    (value: persisted.Schema['alsoLikedCollapseByDefault']) => {
      setState(Boolean(value))
      persisted.write('alsoLikedCollapseByDefault', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('alsoLikedCollapseByDefault', nextValue => {
      setState(Boolean(nextValue))
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useAlsoLikedCollapseByDefault = () => useContext(stateContext)
export const useSetAlsoLikedCollapseByDefault = () => useContext(setContext)

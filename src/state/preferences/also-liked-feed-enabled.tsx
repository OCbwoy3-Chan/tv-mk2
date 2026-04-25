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
  Boolean(persisted.defaults.alsoLikedFeedEnabled),
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('alsoLikedFeedEnabled')),
  )

  const setStateWrapped = useCallback(
    (value: persisted.Schema['alsoLikedFeedEnabled']) => {
      setState(Boolean(value))
      persisted.write('alsoLikedFeedEnabled', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('alsoLikedFeedEnabled', nextValue => {
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

export const useAlsoLikedFeedEnabled = () => useContext(stateContext)
export const useSetAlsoLikedFeedEnabled = () => useContext(setContext)

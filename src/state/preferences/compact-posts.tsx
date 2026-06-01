import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['compactPosts']
type SetContext = (v: persisted.Schema['compactPosts']) => void

const stateContext = createContext<StateContext>(persisted.defaults.compactPosts)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['compactPosts']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('compactPosts'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['compactPosts']) => {
      setState(value)
      persisted.write('compactPosts', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('compactPosts', next => {
      setState(next)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useCompactPosts() {
  return useContext(stateContext)
}

export function useSetCompactPosts() {
  return useContext(setContext)
}

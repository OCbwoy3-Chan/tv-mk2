import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideUnreplyablePosts']
type SetContext = (v: persisted.Schema['hideUnreplyablePosts']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideUnreplyablePosts,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideUnreplyablePosts']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideUnreplyablePosts'))

  const setStateWrapped = useCallback(
    (hideUnreplyablePosts: persisted.Schema['hideUnreplyablePosts']) => {
      setState(hideUnreplyablePosts)
      persisted.write('hideUnreplyablePosts', hideUnreplyablePosts)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideUnreplyablePosts', nextValue => {
      setState(nextValue)
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

export function useHideUnreplyablePosts() {
  return useContext(stateContext) ?? persisted.defaults.hideUnreplyablePosts
}

export function useSetHideUnreplyablePosts() {
  return useContext(setContext)
}

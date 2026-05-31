import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['useHandleInLinks']
type SetContext = (v: persisted.Schema['useHandleInLinks']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.useHandleInLinks,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['useHandleInLinks']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('useHandleInLinks'))

  const setStateWrapped = useCallback(
    (useHandleInLinks: persisted.Schema['useHandleInLinks']) => {
      setState(useHandleInLinks)
      persisted.write('useHandleInLinks', useHandleInLinks)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('useHandleInLinks', nextUseHandleInLinks => {
      setState(nextUseHandleInLinks)
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

export function useHandleInLinks() {
  return useContext(stateContext)
}

export function useSetHandleInLinks() {
  const set = useContext(setContext)

  return useCallback(
    (useHandleInLinks: persisted.Schema['useHandleInLinks']) => {
      set(useHandleInLinks)
    },
    [set],
  )
}

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideDisplayNames']
type SetContext = (v: persisted.Schema['hideDisplayNames']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideDisplayNames,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideDisplayNames']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideDisplayNames'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['hideDisplayNames']) => {
      setState(value)
      persisted.write('hideDisplayNames', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideDisplayNames', next => {
      setState(next)
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

export function useHideDisplayNames() {
  return useContext(stateContext)
}

export function useSetHideDisplayNames() {
  return useContext(setContext)
}

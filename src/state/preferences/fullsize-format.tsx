import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['fullsizeFormat']
type SetContext = (v: persisted.Schema['fullsizeFormat']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.fullsizeFormat,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['fullsizeFormat']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('fullsizeFormat'))

  const setStateWrapped = useCallback(
    (fullsizeFormat: persisted.Schema['fullsizeFormat']) => {
      setState(fullsizeFormat)
      persisted.write('fullsizeFormat', fullsizeFormat)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('fullsizeFormat', nextFullsizeFormat => {
      setState(nextFullsizeFormat)
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

export function useFullsizeFormat() {
  return useContext(stateContext)
}

export function useSetFullsizeFormat() {
  return useContext(setContext)
}

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['loadAsPngs']
type SetContext = (v: persisted.Schema['loadAsPngs']) => void

const stateContext = createContext<StateContext>(persisted.defaults.loadAsPngs)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['loadAsPngs']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('loadAsPngs'))

  const setStateWrapped = useCallback(
    (loadAsPngs: persisted.Schema['loadAsPngs']) => {
      setState(loadAsPngs)
      persisted.write('loadAsPngs', loadAsPngs)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('loadAsPngs', nextLoadAsPngs => {
      setState(nextLoadAsPngs)
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

export function useLoadAsPngs() {
  return useContext(stateContext)
}

export function useSetLoadAsPngs() {
  return useContext(setContext)
}

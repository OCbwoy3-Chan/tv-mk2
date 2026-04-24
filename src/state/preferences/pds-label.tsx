import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['pdsLabel']
type SetContext = (v: persisted.Schema['pdsLabel']) => void

const stateContext = createContext<StateContext>(persisted.defaults.pdsLabel)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['pdsLabel']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('pdsLabel'))

  const setStateWrapped = useMemo(
    () => (pdsLabel: persisted.Schema['pdsLabel']) => {
      setState(pdsLabel)
      persisted.write('pdsLabel', pdsLabel)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('pdsLabel', next => {
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

export function usePdsLabel() {
  return useContext(stateContext) ?? persisted.defaults.pdsLabel!
}

export function usePdsLabelEnabled() {
  return usePdsLabel().enabled
}

export function usePdsLabelHideBskyPds() {
  return usePdsLabel().hideBskyPds
}

export function useSetPdsLabel() {
  return useContext(setContext)
}

export function useSetPdsLabelEnabled() {
  const pdsLabel = usePdsLabel()
  const setPdsLabel = useSetPdsLabel()

  return useMemo(
    () => (enabled: boolean) => setPdsLabel({...pdsLabel, enabled}),
    [pdsLabel, setPdsLabel],
  )
}

export function useSetPdsLabelHideBskyPds() {
  const pdsLabel = usePdsLabel()
  const setPdsLabel = useSetPdsLabel()

  return useMemo(
    () => (hideBskyPds: boolean) => setPdsLabel({...pdsLabel, hideBskyPds}),
    [pdsLabel, setPdsLabel],
  )
}

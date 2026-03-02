import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['pdsLabel']
type SetContext = (v: persisted.Schema['pdsLabel']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.pdsLabel,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['pdsLabel']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('pdsLabel'))

  const setStateWrapped = React.useCallback(
    (pdsLabel: persisted.Schema['pdsLabel']) => {
      setState(pdsLabel)
      persisted.write('pdsLabel', pdsLabel)
    },
    [setState],
  )

  React.useEffect(() => {
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
  return React.useContext(stateContext) ?? persisted.defaults.pdsLabel!
}

export function usePdsLabelEnabled() {
  return usePdsLabel().enabled
}

export function usePdsLabelHideBskyPds() {
  return usePdsLabel().hideBskyPds
}

export function useSetPdsLabel() {
  return React.useContext(setContext)
}

export function useSetPdsLabelEnabled() {
  const pdsLabel = usePdsLabel()
  const setPdsLabel = useSetPdsLabel()

  return React.useMemo(
    () => (enabled: boolean) => setPdsLabel({...pdsLabel, enabled}),
    [pdsLabel, setPdsLabel],
  )
}

export function useSetPdsLabelHideBskyPds() {
  const pdsLabel = usePdsLabel()
  const setPdsLabel = useSetPdsLabel()

  return React.useMemo(
    () => (hideBskyPds: boolean) => setPdsLabel({...pdsLabel, hideBskyPds}),
    [pdsLabel, setPdsLabel],
  )
}

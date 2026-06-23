import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['customPostRkeysEnabled']
type SetContext = (v: persisted.Schema['customPostRkeysEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.customPostRkeysEnabled,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['customPostRkeysEnabled']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('customPostRkeysEnabled'))

  const setStateWrapped = useCallback(
    (customPostRkeysEnabled: persisted.Schema['customPostRkeysEnabled']) => {
      setState(customPostRkeysEnabled)
      void persisted.write('customPostRkeysEnabled', customPostRkeysEnabled)
    },
    [setState],
  )

  useEffect(() => {
    void persisted.onUpdate(
      'customPostRkeysEnabled',
      nextCustomPostRkeysEnabled => {
        setState(nextCustomPostRkeysEnabled)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useCustomPostRkeysEnabled() {
  return useContext(stateContext)
}

export function useSetCustomPostRkeysEnabled() {
  return useContext(setContext)
}

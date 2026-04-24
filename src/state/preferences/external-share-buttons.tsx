import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showExternalShareButtons']
type SetContext = (v: persisted.Schema['showExternalShareButtons']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showExternalShareButtons,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showExternalShareButtons']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showExternalShareButtons'))

  const setStateWrapped = useCallback(
    (
      showExternalShareButtons: persisted.Schema['showExternalShareButtons'],
    ) => {
      setState(showExternalShareButtons)
      persisted.write('showExternalShareButtons', showExternalShareButtons)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'showExternalShareButtons',
      nextShowExternalShareButtons => {
        setState(nextShowExternalShareButtons)
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

export function useShowExternalShareButtons() {
  return useContext(stateContext)
}

export function useSetShowExternalShareButtons() {
  return useContext(setContext)
}

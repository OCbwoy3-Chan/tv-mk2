import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showGermDmButton']
type SetContext = (v: persisted.Schema['showGermDmButton']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showGermDmButton,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showGermDmButton']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showGermDmButton'))

  const setStateWrapped = useCallback(
    (showGermDmButton: persisted.Schema['showGermDmButton']) => {
      setState(showGermDmButton)
      persisted.write('showGermDmButton', showGermDmButton)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('showGermDmButton', nextValue => {
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

export function useShowGermDmButton() {
  return useContext(stateContext) ?? persisted.defaults.showGermDmButton
}

export function useSetShowGermDmButton() {
  return useContext(setContext)
}

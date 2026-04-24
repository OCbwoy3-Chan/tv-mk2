import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: hideFeedsPromoTab – when true, suppress the "Feeds ✨" promotional tab in HomeHeader.

type StateContext = persisted.Schema['hideFeedsPromoTab']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['hideFeedsPromoTab']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideFeedsPromoTab,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideFeedsPromoTab']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideFeedsPromoTab'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['hideFeedsPromoTab']) => {
      setState(value)
      persisted.write('hideFeedsPromoTab', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideFeedsPromoTab', next => {
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

export function useHideFeedsPromoTab() {
  return useContext(stateContext)
}

export function useSetHideFeedsPromoTab() {
  return useContext(setContext)
}

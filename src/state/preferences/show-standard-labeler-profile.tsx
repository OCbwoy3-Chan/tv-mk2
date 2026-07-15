import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showStandardLabelerProfile']
type SetContext = (v: persisted.Schema['showStandardLabelerProfile']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showStandardLabelerProfile,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showStandardLabelerProfile']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    persisted.get('showStandardLabelerProfile'),
  )

  const setStateWrapped = useCallback(
    (
      showStandardLabelerProfile: persisted.Schema['showStandardLabelerProfile'],
    ) => {
      setState(showStandardLabelerProfile)
      persisted.write('showStandardLabelerProfile', showStandardLabelerProfile)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('showStandardLabelerProfile', nextValue => {
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

export function useShowStandardLabelerProfile() {
  return (
    useContext(stateContext) ?? persisted.defaults.showStandardLabelerProfile
  )
}

export function useSetShowStandardLabelerProfile() {
  return useContext(setContext)
}

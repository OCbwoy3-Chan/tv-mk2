import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: enableSquareButtons – when true, disables notifications sent when liking/reposting a post someone else reposted

type StateContext = persisted.Schema['enableSquareButtons']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['enableSquareButtons']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.enableSquareButtons,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['enableSquareButtons']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('enableSquareButtons'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['enableSquareButtons']) => {
      setState(value)
      persisted.write('enableSquareButtons', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('enableSquareButtons', next => {
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

export function useEnableSquareButtons() {
  return useContext(stateContext)
}

export function useSetEnableSquareButtons() {
  return useContext(setContext)
}

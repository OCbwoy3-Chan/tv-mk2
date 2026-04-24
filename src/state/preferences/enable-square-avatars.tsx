import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: enableSquareAvatars – when true, disables notifications sent when liking/reposting a post someone else reposted

type StateContext = persisted.Schema['enableSquareAvatars']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['enableSquareAvatars']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.enableSquareAvatars,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['enableSquareAvatars']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('enableSquareAvatars'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['enableSquareAvatars']) => {
      setState(value)
      persisted.write('enableSquareAvatars', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('enableSquareAvatars', next => {
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

export function useEnableSquareAvatars() {
  return useContext(stateContext)
}

export function useSetEnableSquareAvatars() {
  return useContext(setContext)
}

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableVerifyEmailReminder – when true, disables the "verify email" reminder that you get on boot on mobile, useful if you are on a PDS without any email verification setup

type StateContext = persisted.Schema['disableVerifyEmailReminder']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableVerifyEmailReminder']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableVerifyEmailReminder,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableVerifyEmailReminder']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    persisted.get('disableVerifyEmailReminder'),
  )

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableVerifyEmailReminder']) => {
      setState(value)
      persisted.write('disableVerifyEmailReminder', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableVerifyEmailReminder', next => {
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

export function useDisableVerifyEmailReminder() {
  return useContext(stateContext)
}

export function useSetDisableVerifyEmailReminder() {
  return useContext(setContext)
}

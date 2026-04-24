import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['deerVerification']
type SetContext = (v: persisted.Schema['deerVerification']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.deerVerification,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['deerVerification']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('deerVerification'))

  const setStateWrapped = useCallback(
    (deerVerification: persisted.Schema['deerVerification']) => {
      setState(deerVerification)
      persisted.write('deerVerification', deerVerification)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('deerVerification', nextDeerVerification => {
      setState(nextDeerVerification)
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

export function useDeerVerification() {
  return useContext(stateContext) ?? persisted.defaults.deerVerification!
}

export function useDeerVerificationEnabled() {
  return useDeerVerification().enabled
}

export function useDeerVerificationTrusted(
  mandatory: string | undefined = undefined,
) {
  const trusted = new Set(useDeerVerification().trusted)
  if (mandatory) {
    trusted.add(mandatory)
  }
  return trusted
}

export function useSetDeerVerification() {
  return useContext(setContext)
}

export function useSetDeerVerificationEnabled() {
  const deerVerification = useDeerVerification()
  const setDeerVerification = useSetDeerVerification()

  return useMemo(
    () => (enabled: boolean) =>
      setDeerVerification({...deerVerification, enabled}),
    [deerVerification, setDeerVerification],
  )
}

export function useSetDeerVerificationTrust() {
  const deerVerification = useDeerVerification()
  const setDeerVerification = useSetDeerVerification()

  return useMemo(
    () => ({
      add: (add: string) => {
        const trusted = new Set(deerVerification.trusted)
        trusted.add(add)
        setDeerVerification({...deerVerification, trusted: Array.from(trusted)})
      },
      remove: (remove: string) => {
        const trusted = new Set(deerVerification.trusted)
        trusted.delete(remove)
        setDeerVerification({...deerVerification, trusted: Array.from(trusted)})
      },
    }),
    [deerVerification, setDeerVerification],
  )
}

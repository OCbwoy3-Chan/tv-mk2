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
import {useSession} from '#/state/session'

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
      void persisted.write('deerVerification', deerVerification)
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

export function useDeerVerificationTrustAppView() {
  return useDeerVerification().trustAppView ?? true
}

export function useDeerVerificationTrusted() {
  const deerVerification = useDeerVerification()
  const {currentAccount} = useSession()
  const currentAccountDid = currentAccount?.did
  const trustedSelf = deerVerification.trustedSelf ?? true

  return useMemo(() => {
    const trusted = new Set(deerVerification.trusted)
    if (trustedSelf && currentAccountDid) {
      trusted.add(currentAccountDid)
    }
    return trusted
  }, [currentAccountDid, deerVerification.trusted, trustedSelf])
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
  const {currentAccount} = useSession()
  const currentAccountDid = currentAccount?.did

  return useMemo(
    () => ({
      add: (add: string) => {
        const trusted = new Set(deerVerification.trusted)
        if (add === currentAccountDid) {
          trusted.delete(add)
          setDeerVerification({
            ...deerVerification,
            trustedSelf: true,
            trusted: Array.from(trusted),
          })
          return
        }

        trusted.add(add)
        setDeerVerification({
          ...deerVerification,
          trustedSelf: deerVerification.trustedSelf ?? true,
          trusted: Array.from(trusted),
        })
      },
      remove: (remove: string) => {
        const trusted = new Set(deerVerification.trusted)
        if (remove === currentAccountDid) {
          trusted.delete(remove)
          setDeerVerification({
            ...deerVerification,
            trustedSelf: false,
            trusted: Array.from(trusted),
          })
          return
        }

        trusted.delete(remove)
        setDeerVerification({
          ...deerVerification,
          trustedSelf: deerVerification.trustedSelf ?? true,
          trusted: Array.from(trusted),
        })
      },
    }),
    [currentAccountDid, deerVerification, setDeerVerification],
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import  {type PropsWithChildren} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['requireAltTextEnabled']
type SetContext = (v: persisted.Schema['requireAltTextEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.requireAltTextEnabled,
)
stateContext.displayName = 'AltTextRequiredStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['requireAltTextEnabled']) => {},
)
setContext.displayName = 'AltTextRequiredSetContext'

const forceStateContext = createContext(false)
const forceSetContext = createContext<(value: boolean) => void>(() => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [forceEnabled, setForceEnabled] = useState(
    persisted.get('forceAltTextEnabled') ?? false,
  )
  const setForceEnabledWrapped = (value: boolean) => {
    setForceEnabled(value)
    void persisted.write('forceAltTextEnabled', value)
  }

  useEffect(() => {
    return persisted.onUpdate('forceAltTextEnabled', value => {
      setForceEnabled(value ?? false)
    })
  }, [])

  const [state, setState] = useState(persisted.get('requireAltTextEnabled'))

  const setStateWrapped = useCallback(
    (requireAltTextEnabled: persisted.Schema['requireAltTextEnabled']) => {
      setState(requireAltTextEnabled)
      void persisted.write('requireAltTextEnabled', requireAltTextEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'requireAltTextEnabled',
      nextRequireAltTextEnabled => {
        setState(nextRequireAltTextEnabled)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        <forceStateContext.Provider value={forceEnabled}>
          <forceSetContext.Provider value={setForceEnabledWrapped}>
            {children}
          </forceSetContext.Provider>
        </forceStateContext.Provider>
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useRequireAltTextEnabled() {
  return useContext(stateContext)
}

export function useSetRequireAltTextEnabled() {
  return useContext(setContext)
}

export function useForceAltTextEnabled() {
  return useContext(forceStateContext)
}

export function useSetForceAltTextEnabled() {
  return useContext(forceSetContext)
}

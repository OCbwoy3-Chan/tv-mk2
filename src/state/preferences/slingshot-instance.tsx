import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import  {type PropsWithChildren} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['slingshotInstance']
type SetContext = (v: persisted.Schema['slingshotInstance']) => void
type CustomStateContext = persisted.Schema['slingshotInstanceCustom']
type SetCustomContext = (v: persisted.Schema['slingshotInstanceCustom']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.slingshotInstance,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['slingshotInstance']) => {},
)
const customStateContext = createContext<CustomStateContext>(undefined)
const setCustomContext = createContext<SetCustomContext>(
  (_: persisted.Schema['slingshotInstanceCustom']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('slingshotInstance'))
  const [customState, setCustomState] = useState(
    persisted.get('slingshotInstanceCustom'),
  )

  const setStateWrapped = useCallback(
    (slingshotInstance: persisted.Schema['slingshotInstance']) => {
      setState(slingshotInstance)
      void persisted.write('slingshotInstance', slingshotInstance)
    },
    [],
  )

  const setCustomStateWrapped = useCallback(
    (slingshotInstanceCustom: persisted.Schema['slingshotInstanceCustom']) => {
      setCustomState(slingshotInstanceCustom)
      void persisted.write('slingshotInstanceCustom', slingshotInstanceCustom)
    },
    [],
  )

  useEffect(
    () => persisted.onUpdate('slingshotInstance', next => setState(next)),
    [],
  )

  useEffect(
    () =>
      persisted.onUpdate('slingshotInstanceCustom', next =>
        setCustomState(next),
      ),
    [],
  )

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        <customStateContext.Provider value={customState}>
          <setCustomContext.Provider value={setCustomStateWrapped}>
            {children}
          </setCustomContext.Provider>
        </customStateContext.Provider>
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useSlingshotInstanceSetting() {
  return useContext(stateContext)
}

export function useSlingshotInstanceCustom() {
  return useContext(customStateContext)
}

export function useSlingshotInstance() {
  return useContext(stateContext) ?? persisted.defaults.slingshotInstance!
}

export function useSetSlingshotInstance() {
  return useContext(setContext)
}

export function useSetSlingshotInstanceCustom() {
  return useContext(setCustomContext)
}

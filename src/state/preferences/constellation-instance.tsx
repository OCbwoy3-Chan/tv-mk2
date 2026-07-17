import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type {PropsWithChildren} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['constellationInstance']
type SetContext = (v: persisted.Schema['constellationInstance']) => void
type CustomStateContext = persisted.Schema['constellationInstanceCustom']
type SetCustomContext = (v: persisted.Schema['constellationInstanceCustom']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.constellationInstance,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['constellationInstance']) => {},
)
const customStateContext = createContext<CustomStateContext>(undefined)
const setCustomContext = createContext<SetCustomContext>(
  (_: persisted.Schema['constellationInstanceCustom']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('constellationInstance'))
  const [customState, setCustomState] = useState(
    persisted.get('constellationInstanceCustom'),
  )

  const setStateWrapped = useCallback(
    (constellationInstance: persisted.Schema['constellationInstance']) => {
      setState(constellationInstance)
      persisted.write('constellationInstance', constellationInstance)
    },
    [setState],
  )

  const setCustomStateWrapped = useCallback(
    (
      constellationInstanceCustom: persisted.Schema['constellationInstanceCustom'],
    ) => {
      setCustomState(constellationInstanceCustom)
      persisted.write('constellationInstanceCustom', constellationInstanceCustom)
    },
    [setCustomState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'constellationInstance',
      nextConstellationInstance => {
        setState(nextConstellationInstance)
      },
    )
  }, [setStateWrapped])

  useEffect(() => {
    return persisted.onUpdate(
      'constellationInstanceCustom',
      nextConstellationInstanceCustom => {
        setCustomState(nextConstellationInstanceCustom)
      },
    )
  }, [setCustomStateWrapped])

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

export function useConstellationInstanceSetting() {
  return useContext(stateContext)
}

export function useConstellationInstanceCustom() {
  return useContext(customStateContext)
}

export function useConstellationInstance() {
  return useContext(stateContext) ?? persisted.defaults.constellationInstance!
}

export function useSetConstellationInstance() {
  return useContext(setContext)
}

export function useSetConstellationInstanceCustom() {
  return useContext(setCustomContext)
}

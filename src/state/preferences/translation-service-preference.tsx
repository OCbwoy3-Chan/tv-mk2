import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['translationServicePreference']
type SetContext = (v: persisted.Schema['translationServicePreference']) => void
type InstanceStateContext = persisted.Schema['libreTranslateInstance']
type SetInstanceContext = (
  v: persisted.Schema['libreTranslateInstance'],
) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.translationServicePreference,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['translationServicePreference']) => {},
)
const instanceStateContext = createContext<InstanceStateContext>(
  persisted.defaults.libreTranslateInstance,
)
const setInstanceContext = createContext<SetInstanceContext>(
  (_: persisted.Schema['libreTranslateInstance']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    persisted.get('translationServicePreference'),
  )
  const [instanceState, setInstanceState] = useState(
    persisted.get('libreTranslateInstance'),
  )

  const setStateWrapped = useCallback(
    (
      translationServicePreference: persisted.Schema['translationServicePreference'],
    ) => {
      setState(translationServicePreference)
      persisted.write(
        'translationServicePreference',
        translationServicePreference,
      )
    },
    [setState],
  )

  const setInstanceStateWrapped = useCallback(
    (libreTranslateInstance: persisted.Schema['libreTranslateInstance']) => {
      setInstanceState(libreTranslateInstance)
      persisted.write('libreTranslateInstance', libreTranslateInstance)
    },
    [setInstanceState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'translationServicePreference',
      nextTranslationServicePreference => {
        setState(nextTranslationServicePreference)
      },
    )
  }, [setStateWrapped])

  useEffect(() => {
    return persisted.onUpdate('libreTranslateInstance', nextInstance => {
      setInstanceState(nextInstance)
    })
  }, [setInstanceStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        <instanceStateContext.Provider value={instanceState}>
          <setInstanceContext.Provider value={setInstanceStateWrapped}>
            {children}
          </setInstanceContext.Provider>
        </instanceStateContext.Provider>
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useTranslationServicePreference() {
  return useContext(stateContext)
}

export function useSetTranslationServicePreference() {
  return useContext(setContext)
}

export function useLibreTranslateInstance() {
  return (
    useContext(instanceStateContext) ??
    persisted.defaults.libreTranslateInstance!
  )
}

export function useSetLibreTranslateInstance() {
  return useContext(setInstanceContext)
}

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type atprotoRkeyV2Generation = persisted.Schema['atprotoRkeyV2GenerationDefault']

type StateContext = {
  generation: atprotoRkeyV2Generation
  prefix: string
  suffix: string
}

type SetContext = (value: StateContext) => void

const getDefaultState = (): StateContext => ({
  generation: persisted.defaults.atprotoRkeyV2GenerationDefault,
  prefix: persisted.defaults.atprotoRkeyV2PrefixDefault ?? "",
  suffix: persisted.defaults.atprotoRkeyV2SuffixDefault ?? "",
})

const stateContext = createContext<StateContext>(getDefaultState())
const setContext = createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState<StateContext>(() => ({
    generation:
      persisted.get('atprotoRkeyV2GenerationDefault') ??
      persisted.defaults.atprotoRkeyV2GenerationDefault ?? "tid",
    prefix:
      persisted.get('atprotoRkeyV2PrefixDefault') ??
      persisted.defaults.atprotoRkeyV2PrefixDefault ?? "",
    suffix:
      persisted.get('atprotoRkeyV2SuffixDefault') ??
      persisted.defaults.atprotoRkeyV2SuffixDefault ?? "",
  }))

  const setStateWrapped = useCallback((value: StateContext) => {
    setState(value)
    void persisted.write('atprotoRkeyV2GenerationDefault', value.generation)
    void persisted.write('atprotoRkeyV2PrefixDefault', value.prefix)
    void persisted.write('atprotoRkeyV2SuffixDefault', value.suffix)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoRkeyV2GenerationDefault', next => {
      setState(prev => ({
        ...prev,
        generation:
          next ?? persisted.defaults.atprotoRkeyV2GenerationDefault,
      }))
    })
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoRkeyV2PrefixDefault', next => {
      setState(prev => ({
        ...prev,
        prefix: next ?? persisted.defaults.atprotoRkeyV2PrefixDefault ?? "",
      }))
    })
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoRkeyV2SuffixDefault', next => {
      setState(prev => ({
        ...prev,
        suffix: next ?? persisted.defaults.atprotoRkeyV2SuffixDefault ?? "",
      }))
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useatprotoRkeyV2Settings() {
  return useContext(stateContext)
}

export function useSetatprotoRkeyV2Settings() {
  return useContext(setContext)
}

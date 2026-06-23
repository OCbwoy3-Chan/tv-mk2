import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type AtprotoRkeyGeneration = persisted.Schema['atprotoRkeyGenerationDefault']

type StateContext = {
  generation: AtprotoRkeyGeneration
  prefix: string
  suffix: string
}

type SetContext = (value: StateContext) => void

const getDefaultState = (): StateContext => ({
  generation: persisted.defaults.atprotoRkeyGenerationDefault,
  prefix: persisted.defaults.atprotoRkeyPrefixDefault,
  suffix: persisted.defaults.atprotoRkeySuffixDefault,
})

const stateContext = createContext<StateContext>(getDefaultState())
const setContext = createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState<StateContext>(() => ({
    generation:
      persisted.get('atprotoRkeyGenerationDefault') ??
      persisted.defaults.atprotoRkeyGenerationDefault,
    prefix:
      persisted.get('atprotoRkeyPrefixDefault') ??
      persisted.defaults.atprotoRkeyPrefixDefault,
    suffix:
      persisted.get('atprotoRkeySuffixDefault') ??
      persisted.defaults.atprotoRkeySuffixDefault,
  }))

  const setStateWrapped = useCallback((value: StateContext) => {
    setState(value)
    void persisted.write('atprotoRkeyGenerationDefault', value.generation)
    void persisted.write('atprotoRkeyPrefixDefault', value.prefix)
    void persisted.write('atprotoRkeySuffixDefault', value.suffix)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoRkeyGenerationDefault', next => {
      setState(prev => ({
        ...prev,
        generation:
          next ?? persisted.defaults.atprotoRkeyGenerationDefault,
      }))
    })
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoRkeyPrefixDefault', next => {
      setState(prev => ({
        ...prev,
        prefix: next ?? persisted.defaults.atprotoRkeyPrefixDefault,
      }))
    })
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoRkeySuffixDefault', next => {
      setState(prev => ({
        ...prev,
        suffix: next ?? persisted.defaults.atprotoRkeySuffixDefault,
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

export function useAtprotoRkeySettings() {
  return useContext(stateContext)
}

export function useSetAtprotoRkeySettings() {
  return useContext(setContext)
}

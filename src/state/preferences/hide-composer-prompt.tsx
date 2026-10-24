import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideBetaBadge']
type SetContext = (v: persisted.Schema['hideBetaBadge']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideComposerPrompt,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideComposerPrompt']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideComposerPrompt'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['hideComposerPrompt']) => {
      setState(value)
      void persisted.write('hideComposerPrompt', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideComposerPrompt', next => {
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

export function useHideComposerPrompt() {
  return useContext(stateContext)
}

export function useSetHideComposerPrompt() {
  return useContext(setContext)
}

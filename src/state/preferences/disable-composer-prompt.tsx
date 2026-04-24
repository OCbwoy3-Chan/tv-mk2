import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableComposerPrompt – when true, disables the composer prompt

type StateContext = persisted.Schema['disableComposerPrompt']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableComposerPrompt']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableComposerPrompt,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableComposerPrompt']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableComposerPrompt'))

  const setStateWrapped = useCallback(
    (disableComposerPrompt: persisted.Schema['disableComposerPrompt']) => {
      setState(disableComposerPrompt)
      persisted.write('disableComposerPrompt', disableComposerPrompt)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'disableComposerPrompt',
      nextDisableComposerPrompt => {
        setState(nextDisableComposerPrompt)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useDisableComposerPrompt() {
  return useContext(stateContext)
}

export function useSetDisableComposerPrompt() {
  return useContext(setContext)
}

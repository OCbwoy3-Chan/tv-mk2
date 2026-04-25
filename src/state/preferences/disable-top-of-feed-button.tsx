import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['disableTopOfFeedButton']
type SetContext = (v: persisted.Schema['disableTopOfFeedButton']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableTopOfFeedButton,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableTopOfFeedButton']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableTopOfFeedButton'))

  const setStateWrapped = useCallback(
    (disableTopOfFeedButton: persisted.Schema['disableTopOfFeedButton']) => {
      setState(disableTopOfFeedButton)
      persisted.write('disableTopOfFeedButton', disableTopOfFeedButton)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'disableTopOfFeedButton',
      nextDisableTopOfFeedButton => {
        setState(nextDisableTopOfFeedButton)
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

export function useDisableTopOfFeedButton() {
  return useContext(stateContext)
}

export function useSetDisableTopOfFeedButton() {
  return useContext(setContext)
}

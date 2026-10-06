import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['twitterEasterEgg']
type SetContext = (v: persisted.Schema['twitterEasterEgg']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.twitterEasterEgg,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['twitterEasterEgg']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('twitterEasterEgg'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['twitterEasterEgg']) => {
      setState(value)
      void persisted.write('twitterEasterEgg', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideOwnTennaBadge', next => {
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

export function useTwitterEasterEggEnabled() {
  return useContext(stateContext)
}

export function useSetTwitterEasterEggEnabled() {
  return useContext(setContext)
}

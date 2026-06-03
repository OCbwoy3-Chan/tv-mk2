import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.showFollowsYouBadge),
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    Boolean(persisted.get('showFollowsYouBadge')),
  )

  const setStateWrapped = useCallback(
    (showFollowsYouBadge: boolean) => {
      setState(showFollowsYouBadge)
      persisted.write('showFollowsYouBadge', showFollowsYouBadge)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('showFollowsYouBadge', next => {
      setState(Boolean(next))
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

export function useShowFollowsYouBadge() {
  return useContext(stateContext)
}

export function useSetShowFollowsYouBadge() {
  return useContext(setContext)
}

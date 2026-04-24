import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showFollowsYouBadge']
type SetContext = (v: persisted.Schema['showFollowsYouBadge']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showFollowsYouBadge,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showFollowsYouBadge']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showFollowsYouBadge'))

  const setStateWrapped = useCallback(
    (showFollowsYouBadge: persisted.Schema['showFollowsYouBadge']) => {
      setState(showFollowsYouBadge)
      persisted.write('showFollowsYouBadge', showFollowsYouBadge)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'showFollowsYouBadge',
      nextShowFollowsYouBadge => {
        setState(nextShowFollowsYouBadge)
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

export function useShowFollowsYouBadge() {
  return useContext(stateContext)
}

export function useSetShowFollowsYouBadge() {
  return useContext(setContext)
}

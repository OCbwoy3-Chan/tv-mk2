import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showFollowsYouBadge']
type SetContext = (v: persisted.Schema['showFollowsYouBadge']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.showFollowsYouBadge,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['showFollowsYouBadge']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('showFollowsYouBadge'))

  const setStateWrapped = React.useCallback(
    (showFollowsYouBadge: persisted.Schema['showFollowsYouBadge']) => {
      setState(showFollowsYouBadge)
      persisted.write('showFollowsYouBadge', showFollowsYouBadge)
    },
    [setState],
  )

  React.useEffect(() => {
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
  return React.useContext(stateContext)
}

export function useSetShowFollowsYouBadge() {
  return React.useContext(setContext)
}

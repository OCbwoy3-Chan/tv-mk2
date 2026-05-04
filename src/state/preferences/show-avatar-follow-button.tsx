import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showAvatarFollowButton']
type SetContext = (v: persisted.Schema['showAvatarFollowButton']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showAvatarFollowButton,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showAvatarFollowButton']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showAvatarFollowButton'))

  const setStateWrapped = useCallback(
    (showAvatarFollowButton: persisted.Schema['showAvatarFollowButton']) => {
      setState(showAvatarFollowButton)
      persisted.write('showAvatarFollowButton', showAvatarFollowButton)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'showAvatarFollowButton',
      nextShowAvatarFollowButton => {
        setState(nextShowAvatarFollowButton)
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

export function useShowAvatarFollowButton() {
  return useContext(stateContext) ?? persisted.defaults.showAvatarFollowButton
}

export function useSetShowAvatarFollowButton() {
  return useContext(setContext)
}

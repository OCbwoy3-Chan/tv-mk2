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
  persisted.defaults.showFollowedByOnOwnProfile ?? true,
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    persisted.get('showFollowedByOnOwnProfile') ??
      persisted.defaults.showFollowedByOnOwnProfile ??
      true,
  )

  const setStateWrapped = useCallback((showFollowedByOnOwnProfile: boolean) => {
    setState(showFollowedByOnOwnProfile)
    persisted.write('showFollowedByOnOwnProfile', showFollowedByOnOwnProfile)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('showFollowedByOnOwnProfile', next => {
      setState(
        next ?? persisted.defaults.showFollowedByOnOwnProfile ?? true,
      )
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

export function useShowFollowedByOnOwnProfile() {
  return useContext(stateContext)
}

export function useSetShowFollowedByOnOwnProfile() {
  return useContext(setContext)
}

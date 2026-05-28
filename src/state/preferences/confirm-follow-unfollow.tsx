import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['confirmFollowUnfollow']
type SetContext = (v: persisted.Schema['confirmFollowUnfollow']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.confirmFollowUnfollow,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['confirmFollowUnfollow']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('confirmFollowUnfollow'))

  const setStateWrapped = useCallback(
    (confirmFollowUnfollow: persisted.Schema['confirmFollowUnfollow']) => {
      setState(confirmFollowUnfollow)
      persisted.write('confirmFollowUnfollow', confirmFollowUnfollow)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('confirmFollowUnfollow', nextValue => {
      setState(nextValue)
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

export function useConfirmFollowUnfollow() {
  return useContext(stateContext) ?? persisted.defaults.confirmFollowUnfollow
}

export function useSetConfirmFollowUnfollow() {
  return useContext(setContext)
}

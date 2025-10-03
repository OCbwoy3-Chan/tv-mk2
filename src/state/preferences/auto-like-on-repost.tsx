import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['autoLikeOnRepost']
type SetContext = (v: persisted.Schema['autoLikeOnRepost']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.autoLikeOnRepost,
)
stateContext.displayName = 'AutoLikeOnRepostStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['autoLikeOnRepost']) => {},
)
setContext.displayName = 'AutoLikeOnRepostStateContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('autoLikeOnRepost'))

  const setStateWrapped = useCallback(
    (autoLikeOnRepost: persisted.Schema['autoLikeOnRepost']) => {
      setState(autoLikeOnRepost)
      persisted.write('autoLikeOnRepost', autoLikeOnRepost)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('autoLikeOnRepost', nextAutoLikeOnRepost => {
      setState(nextAutoLikeOnRepost)
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

export function useAutoLikeOnRepost() {
  return useContext(stateContext)
}

export function useSetAutoLikeOnRepost() {
  return useContext(setContext)
}

export function getAutoLikeOnRepost() {
  return (
    persisted.get('autoLikeOnRepost') || persisted.defaults.autoLikeOnRepost!
  )
}

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

interface PostReplacementState {
  enabled: boolean
  postName: string
  postsName: string
}

type StateContext = PostReplacementState
type SetContext = (
  v:
    | PostReplacementState
    | ((curr: PostReplacementState) => PostReplacementState),
) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.postReplacement as PostReplacementState,
)
const setContext = createContext<SetContext>(
  (
    _:
      | PostReplacementState
      | ((curr: PostReplacementState) => PostReplacementState),
  ) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, _setState] = useState<PostReplacementState>(() => {
    const persistedState = persisted.get('postReplacement')
    return {
      enabled:
        persistedState?.enabled ?? persisted.defaults.postReplacement.enabled!,
      postName:
        persistedState?.postName ??
        persisted.defaults.postReplacement.postName!,
      postsName:
        persistedState?.postsName ??
        persisted.defaults.postReplacement.postsName!,
    }
  })

  const setState = useCallback(
    (
      val:
        | PostReplacementState
        | ((curr: PostReplacementState) => PostReplacementState),
    ) => {
      _setState(curr => {
        const next = typeof val === 'function' ? val(curr) : val
        persisted.write('postReplacement', next)
        return next
      })
    },
    [],
  )

  useEffect(() => {
    return persisted.onUpdate('postReplacement', next => {
      setState({
        postName: next.postName ?? 'skeet',
        postsName: next.postsName ?? 'skeets',
        enabled: next.enabled ?? true,
      })
    })
  }, [setState])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function usePostReplacement() {
  return useContext(stateContext)
}

export function useSetPostReplacement() {
  return useContext(setContext)
}

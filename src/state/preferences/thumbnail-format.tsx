import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['thumbnailFormat']
type SetContext = (v: persisted.Schema['thumbnailFormat']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.thumbnailFormat,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['thumbnailFormat']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('thumbnailFormat'))

  const setStateWrapped = useCallback(
    (thumbnailFormat: persisted.Schema['thumbnailFormat']) => {
      setState(thumbnailFormat)
      persisted.write('thumbnailFormat', thumbnailFormat)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('thumbnailFormat', nextThumbnailFormat => {
      setState(nextThumbnailFormat)
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

export function useThumbnailFormat() {
  return useContext(stateContext)
}

export function useSetThumbnailFormat() {
  return useContext(setContext)
}

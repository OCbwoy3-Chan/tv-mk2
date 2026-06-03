import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['downloadFormat']
type SetContext = (v: persisted.Schema['downloadFormat']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.downloadFormat,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['downloadFormat']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('downloadFormat'))

  const setStateWrapped = useCallback(
    (downloadFormat: persisted.Schema['downloadFormat']) => {
      setState(downloadFormat)
      persisted.write('downloadFormat', downloadFormat)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('downloadFormat', nextDownloadFormat => {
      setState(nextDownloadFormat)
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

export function useDownloadFormat() {
  return useContext(stateContext)
}

export function useSetDownloadFormat() {
  return useContext(setContext)
}

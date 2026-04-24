import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['faviconService']
type SetContext = (v: persisted.Schema['faviconService']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.faviconService,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['faviconService']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('faviconService'))

  const setStateWrapped = useCallback(
    (faviconService: persisted.Schema['faviconService']) => {
      setState(faviconService)
      persisted.write('faviconService', faviconService)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('faviconService', next => {
      setState(next)
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

export function useFaviconService() {
  return useContext(stateContext) ?? persisted.defaults.faviconService
}

export function useSetFaviconService() {
  const setFaviconService = useContext(setContext)
  return setFaviconService
}

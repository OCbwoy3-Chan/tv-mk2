import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['ignoredAppLabelers']
type SetContext = (v: persisted.Schema['ignoredAppLabelers']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.ignoredAppLabelers,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['ignoredAppLabelers']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('ignoredAppLabelers'))

  const setStateWrapped = useCallback(
    (ignoredAppLabelers: persisted.Schema['ignoredAppLabelers']) => {
      setState(ignoredAppLabelers)
      persisted.write('ignoredAppLabelers', ignoredAppLabelers)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('ignoredAppLabelers', nextIgnoredAppLabelers => {
      setState(nextIgnoredAppLabelers)
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

export function useIgnoredAppLabelers() {
  return useContext(stateContext) ?? persisted.defaults.ignoredAppLabelers!
}

export function useSetIgnoredAppLabelers() {
  return useContext(setContext)
}

export function getIgnoredAppLabelers() {
  return (
    persisted.get('ignoredAppLabelers') ??
    persisted.defaults.ignoredAppLabelers!
  )
}

export function isIgnoredAppLabeler(did: string) {
  return getIgnoredAppLabelers().includes(did)
}

export function addIgnoredAppLabeler(did: string) {
  const ignored = getIgnoredAppLabelers()
  if (ignored.includes(did)) return
  persisted.write('ignoredAppLabelers', [...ignored, did])
}

export function removeIgnoredAppLabeler(did: string) {
  persisted.write(
    'ignoredAppLabelers',
    getIgnoredAppLabelers().filter(d => d !== did),
  )
}

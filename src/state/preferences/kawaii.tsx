import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'
import {IS_WEB} from '#/env'

type StateContext = persisted.Schema['kawaii']

const stateContext = createContext<StateContext>(persisted.defaults.kawaii)
stateContext.displayName = 'KawaiiStateContext'

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('kawaii'))

  const setStateWrapped = useCallback(
    (kawaii: persisted.Schema['kawaii']) => {
      setState(kawaii)
      persisted.write('kawaii', kawaii)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('kawaii', nextKawaii => {
      setState(nextKawaii)
    })
  }, [setStateWrapped])

  useEffect(() => {
    // dumb and stupid but it's web only so just refresh the page if you want to change it

    if (IS_WEB) {
      const kawaii = new URLSearchParams(window.location.search).get('kawaii')
      switch (kawaii) {
        case 'true':
          setStateWrapped(true)
          break
        case 'false':
          setStateWrapped(false)
          break
      }
    }
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setterContext.Provider value={setStateWrapped}>
        {children}
      </setterContext.Provider>
    </stateContext.Provider>
  )
}

export function useKawaiiMode() {
  return useContext(stateContext)
}

const setterContext = createContext<(kawaii: boolean) => void>(
  (_: boolean) => {},
)
setterContext.displayName = 'KawaiiSetterContext'

export function useSetKawaiiMode() {
  return useContext(setterContext)
}

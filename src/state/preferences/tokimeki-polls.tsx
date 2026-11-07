import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

const stateContext = createContext(true)
const setContext = createContext<(value: boolean) => void>(() => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(persisted.get('tokimekiPolls') ?? true)

  function setPreference(value: boolean) {
    setState(value)
    void persisted.write('tokimekiPolls', value)
  }

  useEffect(() => {
    return persisted.onUpdate('tokimekiPolls', value => {
      setState(value ?? true)
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setPreference}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useTokimekiPolls() {
  return useContext(stateContext)
}

export function useSetTokimekiPolls() {
  return useContext(setContext)
}

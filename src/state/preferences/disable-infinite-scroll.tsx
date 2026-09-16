import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

const stateContext = createContext(false)
const setContext = createContext<(value: boolean) => void>(() => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    persisted.get('disableInfiniteScroll') ?? false,
  )

  function setPreference(value: boolean) {
    setState(value)
    void persisted.write('disableInfiniteScroll', value)
  }

  useEffect(() => {
    return persisted.onUpdate('disableInfiniteScroll', value => {
      setState(value ?? false)
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

export function useDisableInfiniteScroll() {
  return useContext(stateContext)
}

export function useSetDisableInfiniteScroll() {
  return useContext(setContext)
}

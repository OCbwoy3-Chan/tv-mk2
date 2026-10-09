import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

const stateContext = createContext(true)
const setContext = createContext<(value: boolean) => void>(() => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(persisted.get('showPostTags') ?? true)

  function setStateWrapped(value: boolean) {
    setState(value)
    void persisted.write('showPostTags', value)
  }

  useEffect(() => {
    return persisted.onUpdate('showPostTags', value => {
      setState(value ?? true)
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useShowPostTags() {
  return useContext(stateContext)
}

export function useSetShowPostTags() {
  return useContext(setContext)
}

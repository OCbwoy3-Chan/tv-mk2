import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = NonNullable<persisted.Schema['atprotoExplorer']>
type SetContext = (value: StateContext) => void

const fallback = persisted.defaults.atprotoExplorer!
export const DEFAULT_ATPROTO_EXPLORER = fallback
const stateContext = createContext<StateContext>(fallback)
const setContext = createContext<SetContext>((_: StateContext) => {})

function normalizeSetting(value: StateContext): StateContext {
  const url = value.url.split('{uri}').join('(uri)')
  return url === value.url ? value : {...value, url}
}

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(() =>
    normalizeSetting(persisted.get('atprotoExplorer') ?? fallback),
  )

  const setStateWrapped = useCallback((value: StateContext) => {
    const next = normalizeSetting(value)
    setState(next)
    void persisted.write('atprotoExplorer', next)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('atprotoExplorer', next => {
      setState(normalizeSetting(next ?? fallback))
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

export function useAtprotoExplorerSetting() {
  return useContext(stateContext)
}

export function useAtprotoExplorer() {
  const setting = useContext(stateContext)
  return {
    name: setting.name.trim() || fallback.name,
    url: setting.url.trim() || fallback.url,
  }
}

export function useSetAtprotoExplorer() {
  return useContext(setContext)
}

export function toAtprotoExplorerUrl(
  explorer: ReturnType<typeof useAtprotoExplorer>,
  uri: string,
) {
  const template = explorer.url.includes('(uri)')
    ? explorer.url.split('(uri)').join(uri)
    : `${explorer.url.replace(/\/+$/, '')}/${uri}`

  try {
    const url = new URL(template)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {}

  return fallback.url.split('(uri)').join(uri)
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  trendingTopicCount: number
  trendingDisabled: Exclude<persisted.Schema['trendingDisabled'], undefined>
  trendingVideoDisabled: Exclude<
    persisted.Schema['trendingVideoDisabled'],
    undefined
  >
}
type ApiContext = {
  setTrendingTopicCount(count: number): void
  setTrendingDisabled(
    hidden: Exclude<persisted.Schema['trendingDisabled'], undefined>,
  ): void
  setTrendingVideoDisabled(
    hidden: Exclude<persisted.Schema['trendingVideoDisabled'], undefined>,
  ): void
}

const StateContext = createContext<StateContext>({
  trendingTopicCount: 5,
  trendingDisabled: Boolean(persisted.defaults.trendingDisabled),
  trendingVideoDisabled: Boolean(persisted.defaults.trendingVideoDisabled),
})
StateContext.displayName = 'TrendingStateContext'
const ApiContext = createContext<ApiContext>({
  setTrendingTopicCount() {},
  setTrendingDisabled() {},
  setTrendingVideoDisabled() {},
})
ApiContext.displayName = 'TrendingApiContext'

function usePersistedBooleanValue<T extends keyof persisted.Schema>(key: T) {
  const [value, _set] = useState(() => {
    return Boolean(persisted.get(key))
  })
  const set = useCallback<
    (value: Exclude<persisted.Schema[T], undefined>) => void
  >(
    hidden => {
      _set(Boolean(hidden))
      void persisted.write(key, hidden)
    },
    [key, _set],
  )
  useEffect(() => {
    return persisted.onUpdate(key, hidden => {
      _set(Boolean(hidden))
    })
  }, [key, _set])

  return [value, set] as const
}

export function Provider({children}: {children: React.ReactNode}) {
  const [trendingDisabled, setTrendingDisabled] =
    usePersistedBooleanValue('trendingDisabled')
  const [trendingVideoDisabled, setTrendingVideoDisabled] =
    usePersistedBooleanValue('trendingVideoDisabled')

  const [trendingTopicCount, setCount] = useState(
    () => persisted.get('trendingTopicCount') ?? 5,
  )
  useEffect(
    () =>
      persisted.onUpdate('trendingTopicCount', count => setCount(count ?? 5)),
    [],
  )
  const setTrendingTopicCount = (count: number) => {
    if (!Number.isInteger(count) || count < 1 || count > 25) return
    setCount(count)
    void persisted.write('trendingTopicCount', count)
  }

  /*
   * Context
   */
  const state = useMemo(
    () => ({trendingDisabled, trendingVideoDisabled, trendingTopicCount}),
    [trendingDisabled, trendingVideoDisabled, trendingTopicCount],
  )
  const api = {
    setTrendingDisabled,
    setTrendingVideoDisabled,
    setTrendingTopicCount,
  }

  return (
    <StateContext.Provider value={state}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useTrendingSettings() {
  return useContext(StateContext)
}

export function useTrendingSettingsApi() {
  return useContext(ApiContext)
}

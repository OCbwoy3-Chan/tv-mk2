import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  type CountsMetricsDisplay,
  type FollowedByMetricsDisplay,
  migrateCountsMetricsDisplay,
  migrateFollowedByMetricsDisplay,
  type NotificationDotDisplay,
} from '#/lib/metrics-display'
import * as persisted from '#/state/persisted'

type CountsPrefs = {
  displayKey:
    | 'likesMetricsDisplay'
    | 'repostsMetricsDisplay'
    | 'quotesMetricsDisplay'
    | 'savesMetricsDisplay'
    | 'replyMetricsDisplay'
    | 'followersMetricsDisplay'
    | 'followingMetricsDisplay'
    | 'postsMetricsDisplay'
  legacyDisableKey:
    | 'disableLikesMetrics'
    | 'disableRepostsMetrics'
    | 'disableQuotesMetrics'
    | 'disableSavesMetrics'
    | 'disableReplyMetrics'
    | 'disableFollowersMetrics'
    | 'disableFollowingMetrics'
    | 'disablePostsMetrics'
}

function createCountsMetricsDisplayPreference({
  displayKey,
  legacyDisableKey,
}: CountsPrefs) {
  const stateContext = createContext<CountsMetricsDisplay>(
    migrateCountsMetricsDisplay(
      persisted.defaults[displayKey],
      persisted.defaults[legacyDisableKey],
    ),
  )
  const setContext = createContext<(v: CountsMetricsDisplay) => void>(() => {})

  function Provider({children}: PropsWithChildren<{}>) {
    const [state, setState] = useState(() =>
      migrateCountsMetricsDisplay(
        persisted.get(displayKey),
        persisted.get(legacyDisableKey),
      ),
    )

    const setStateWrapped = useCallback((value: CountsMetricsDisplay) => {
      setState(value)
      persisted.write(displayKey, value)
    }, [])

    useEffect(() => {
      return persisted.onUpdate(displayKey, next => {
        setState(
          migrateCountsMetricsDisplay(next, persisted.get(legacyDisableKey)),
        )
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

  function useMetricsDisplay() {
    return useContext(stateContext)
  }

  function useSetMetricsDisplay() {
    return useContext(setContext)
  }

  return {Provider, useMetricsDisplay, useSetMetricsDisplay}
}

function createFollowedByMetricsDisplayPreference() {
  const displayKey = 'followedByMetricsDisplay' as const
  const legacyDisableKey = 'disableFollowedByMetrics' as const

  const stateContext = createContext<FollowedByMetricsDisplay>(
    migrateFollowedByMetricsDisplay(
      persisted.defaults[displayKey],
      persisted.defaults[legacyDisableKey],
    ),
  )
  const setContext = createContext<(v: FollowedByMetricsDisplay) => void>(
    () => {},
  )

  function Provider({children}: PropsWithChildren<{}>) {
    const [state, setState] = useState(() =>
      migrateFollowedByMetricsDisplay(
        persisted.get(displayKey),
        persisted.get(legacyDisableKey),
      ),
    )

    const setStateWrapped = useCallback((value: FollowedByMetricsDisplay) => {
      setState(value)
      persisted.write(displayKey, value)
    }, [])

    useEffect(() => {
      return persisted.onUpdate(displayKey, next => {
        setState(
          migrateFollowedByMetricsDisplay(
            next,
            persisted.get(legacyDisableKey),
          ),
        )
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

  function useMetricsDisplay() {
    return useContext(stateContext)
  }

  function useSetMetricsDisplay() {
    return useContext(setContext)
  }

  return {Provider, useMetricsDisplay, useSetMetricsDisplay}
}

function createNotificationDotDisplayPreference({
  displayKey,
}: {
  displayKey: 'notificationsTabBadgeDisplay' | 'chatsTabBadgeDisplay'
}) {
  const defaultDisplay: NotificationDotDisplay = 'exact'
  const stateContext = createContext<NotificationDotDisplay>(defaultDisplay)
  const setContext = createContext<(v: NotificationDotDisplay) => void>(
    () => {},
  )

  function Provider({children}: PropsWithChildren<{}>) {
    const [state, setState] = useState<NotificationDotDisplay>(
      () => persisted.get(displayKey) ?? defaultDisplay,
    )

    const setStateWrapped = useCallback((value: NotificationDotDisplay) => {
      setState(value)
      void persisted.write(displayKey, value)
    }, [])

    useEffect(() => {
      return persisted.onUpdate(displayKey, next => {
        setState(next ?? defaultDisplay)
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

  function useDisplay() {
    return useContext(stateContext)
  }

  function useSetDisplay() {
    return useContext(setContext)
  }

  return {Provider, useDisplay, useSetDisplay}
}

const likes = createCountsMetricsDisplayPreference({
  displayKey: 'likesMetricsDisplay',
  legacyDisableKey: 'disableLikesMetrics',
})
const reposts = createCountsMetricsDisplayPreference({
  displayKey: 'repostsMetricsDisplay',
  legacyDisableKey: 'disableRepostsMetrics',
})
const quotes = createCountsMetricsDisplayPreference({
  displayKey: 'quotesMetricsDisplay',
  legacyDisableKey: 'disableQuotesMetrics',
})
const saves = createCountsMetricsDisplayPreference({
  displayKey: 'savesMetricsDisplay',
  legacyDisableKey: 'disableSavesMetrics',
})
const reply = createCountsMetricsDisplayPreference({
  displayKey: 'replyMetricsDisplay',
  legacyDisableKey: 'disableReplyMetrics',
})
const followers = createCountsMetricsDisplayPreference({
  displayKey: 'followersMetricsDisplay',
  legacyDisableKey: 'disableFollowersMetrics',
})
const following = createCountsMetricsDisplayPreference({
  displayKey: 'followingMetricsDisplay',
  legacyDisableKey: 'disableFollowingMetrics',
})
const posts = createCountsMetricsDisplayPreference({
  displayKey: 'postsMetricsDisplay',
  legacyDisableKey: 'disablePostsMetrics',
})
const followedBy = createFollowedByMetricsDisplayPreference()
const notificationsTabBadge = createNotificationDotDisplayPreference({
  displayKey: 'notificationsTabBadgeDisplay',
})
const chatsTabBadge = createNotificationDotDisplayPreference({
  displayKey: 'chatsTabBadgeDisplay',
})

export const useLikesMetricsDisplay = likes.useMetricsDisplay
export const useSetLikesMetricsDisplay = likes.useSetMetricsDisplay
export const useRepostsMetricsDisplay = reposts.useMetricsDisplay
export const useSetRepostsMetricsDisplay = reposts.useSetMetricsDisplay
export const useQuotesMetricsDisplay = quotes.useMetricsDisplay
export const useSetQuotesMetricsDisplay = quotes.useSetMetricsDisplay
export const useSavesMetricsDisplay = saves.useMetricsDisplay
export const useSetSavesMetricsDisplay = saves.useSetMetricsDisplay
export const useReplyMetricsDisplay = reply.useMetricsDisplay
export const useSetReplyMetricsDisplay = reply.useSetMetricsDisplay
export const useFollowersMetricsDisplay = followers.useMetricsDisplay
export const useSetFollowersMetricsDisplay = followers.useSetMetricsDisplay
export const useFollowingMetricsDisplay = following.useMetricsDisplay
export const useSetFollowingMetricsDisplay = following.useSetMetricsDisplay
export const usePostsMetricsDisplay = posts.useMetricsDisplay
export const useSetPostsMetricsDisplay = posts.useSetMetricsDisplay
export const useFollowedByMetricsDisplay = followedBy.useMetricsDisplay
export const useSetFollowedByMetricsDisplay = followedBy.useSetMetricsDisplay
export const useNotificationsTabBadgeDisplay = notificationsTabBadge.useDisplay
export const useSetNotificationsTabBadgeDisplay =
  notificationsTabBadge.useSetDisplay
export const useChatsTabBadgeDisplay = chatsTabBadge.useDisplay
export const useSetChatsTabBadgeDisplay = chatsTabBadge.useSetDisplay

export function MetricsDisplayPreferencesProvider({
  children,
}: PropsWithChildren<{}>) {
  return (
    <likes.Provider>
      <reposts.Provider>
        <quotes.Provider>
          <saves.Provider>
            <reply.Provider>
              <followers.Provider>
                <following.Provider>
                  <followedBy.Provider>
                    <posts.Provider>
                      <notificationsTabBadge.Provider>
                        <chatsTabBadge.Provider>{children}</chatsTabBadge.Provider>
                      </notificationsTabBadge.Provider>
                    </posts.Provider>
                  </followedBy.Provider>
                </following.Provider>
              </followers.Provider>
            </reply.Provider>
          </saves.Provider>
        </quotes.Provider>
      </reposts.Provider>
    </likes.Provider>
  )
}

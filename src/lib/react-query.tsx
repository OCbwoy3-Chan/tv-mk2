import {useEffect, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister'
import {
  type DehydrateOptions,
  focusManager,
  IsRestoringProvider,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {
  type PersistQueryClientOptions,
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client'

import {createPersistedQueryStorage} from '#/lib/persisted-query-storage'
import {
  getRetainedQueryClient,
  holdRetainedQueryClient,
  type RetainedValue,
} from '#/lib/retained-query-clients'
import {listenNetworkConfirmed, listenNetworkLost} from '#/state/events'
import {isQueryPersisted} from '#/state/queries/util'
import * as env from '#/env'
import {IS_NATIVE, IS_WEB} from '#/env'
import {
  isFollowingSnapshotQuery,
  loadFollowingSnapshot,
  saveFollowingSnapshot,
} from '#/features/followingV2/home/queries/followingSnapshot'
import {PUBLIC_BSKY_SERVICE} from './constants'

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: QueryClient
  }
}

async function checkIsOnline(): Promise<boolean> {
  try {
    const controller = new AbortController()
    setTimeout(() => {
      controller.abort()
    }, 15e3)
    const res = await fetch(`${PUBLIC_BSKY_SERVICE}/xrpc/_health`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    const json = await res.json()
    if (json.version) {
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}

let receivedNetworkLost = false
let receivedNetworkConfirmed = false
let isNetworkStateUnclear = false

listenNetworkLost(() => {
  receivedNetworkLost = true
  onlineManager.setOnline(false)
})

listenNetworkConfirmed(() => {
  receivedNetworkConfirmed = true
  onlineManager.setOnline(true)
})

let checkPromise: Promise<void> | undefined
function checkIsOnlineIfNeeded() {
  if (checkPromise) {
    return
  }
  receivedNetworkLost = false
  receivedNetworkConfirmed = false
  checkPromise = checkIsOnline().then(nextIsOnline => {
    checkPromise = undefined
    if (nextIsOnline && receivedNetworkLost) {
      isNetworkStateUnclear = true
    }
    if (!nextIsOnline && receivedNetworkConfirmed) {
      isNetworkStateUnclear = true
    }
    if (!isNetworkStateUnclear) {
      onlineManager.setOnline(nextIsOnline)
    }
  })
}

setInterval(() => {
  if (AppState.currentState === 'active') {
    if (!onlineManager.isOnline() || isNetworkStateUnclear) {
      checkIsOnlineIfNeeded()
    }
  }
}, 2000)

focusManager.setEventListener(onFocus => {
  if (IS_NATIVE) {
    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        focusManager.setFocused(status === 'active')
      },
    )

    return () => subscription.remove()
  } else if (typeof window !== 'undefined' && window.addEventListener) {
    // these handlers are a bit redundant but focus catches when the browser window
    // is blurred/focused while visibilitychange seems to only handle when the
    // window minimizes (both of them catch tab changes)
    // there's no harm to redundant fires because refetchOnWindowFocus is only
    // used with queries that employ stale data times
    const handler = () => onFocus()
    window.addEventListener('focus', handler, false)
    window.addEventListener('visibilitychange', handler, false)
    return () => {
      window.removeEventListener('visibilitychange', handler)
      window.removeEventListener('focus', handler)
    }
  }
})

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // NOTE
        // refetchOnWindowFocus breaks some UIs (like feeds)
        // so we only selectively want to enable this
        // -prf
        refetchOnWindowFocus: false,
        // Structural sharing between responses makes it impossible to rely on
        // "first seen" timestamps on objects to determine if they're fresh.
        // Disable this optimization so that we can rely on "first seen" timestamps.
        structuralSharing: false,
        // We don't want to retry queries by default, because in most cases we
        // want to fail early and show a response to the user. There are
        // exceptions, and those can be made on a per-query basis. For others, we
        // should give users controls to retry.
        retry: false,
      },
    },
  })

const dehydrateOptions: DehydrateOptions = {
  shouldDehydrateMutation: (_: any) => false,
  shouldDehydrateQuery: query => {
    return (
      (isQueryPersisted(query.queryKey) || isFollowingSnapshotQuery(query)) &&
      query.state.status === 'success'
    )
  },
}

type RetainedQueryClient = RetainedValue & {
  queryClient: QueryClient
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  /** Shared so a retained client reads storage only on its first mount. */
  restore?: Promise<void>
  restored: boolean
}

function createRetainedQueryClient(
  currentDid: string | undefined,
): RetainedQueryClient {
  const id = currentDid ?? 'logged-out'
  const queryClient = createQueryClient()
  const base = createPersistedQueryStorage(id)
  let retired = false
  /*
   * The persister throttles writes, so one can still be queued after the
   * provider unsubscribes. Once the account is logged out or removed its
   * storage is cleared, and a late write must not bring the data back.
   */
  const storage: typeof base = {
    getItem: async key => {
      if (retired) return null
      const value = await base.getItem(key)
      // Discarded while reading: don't hydrate the client being freed.
      return retired ? null : value
    },
    setItem: (key, value) =>
      retired ? Promise.resolve() : base.setItem(key, value),
    removeItem: key => (retired ? Promise.resolve() : base.removeItem(key)),
  }
  const persister = createAsyncStoragePersister({
    storage,
    key: 'queryClient-' + id,
    // JSON, as by default, but with Following v2's Home Following snapshot.
    serialize: client => JSON.stringify(saveFollowingSnapshot(client)),
    deserialize: cached => loadFollowingSnapshot(JSON.parse(cached)),
  })
  return {
    queryClient,
    persistOptions: {persister, dehydrateOptions, buster: env.APP_VERSION},
    restored: false,
    retire: () => {
      retired = true
    },
    dispose: () => {
      void queryClient.cancelQueries()
      queryClient.clear()
    },
  }
}

export function QueryProvider({
  children,
  currentDid,
}: {
  children: React.ReactNode
  currentDid: string | undefined
}) {
  return (
    <QueryProviderInner
      // Enforce we never reuse cache between users.
      // These two props MUST stay in sync.
      key={currentDid}
      currentDid={currentDid}>
      {children}
    </QueryProviderInner>
  )
}

function QueryProviderInner({
  children,
  currentDid,
}: {
  children: React.ReactNode
  currentDid: string | undefined
}) {
  const [initialDid] = useState(currentDid)
  if (currentDid !== initialDid) {
    throw Error(
      'Something is very wrong. Expected did to be stable due to key above.',
    )
  }
  /*
   * The query client is scoped to a specific DID. It is kept across account
   * switches (see retained-query-clients) so switching back to an account
   * renders its cached screens immediately.
   */
  const [retained, _setRetained] = useState(() =>
    getRetainedQueryClient(currentDid ?? 'logged-out', () =>
      createRetainedQueryClient(currentDid),
    ),
  )
  const {queryClient, persistOptions} = retained
  const [isRestoring, setIsRestoring] = useState(!retained.restored)

  useEffect(() => holdRetainedQueryClient(retained), [retained])

  /*
   * Like PersistQueryClientProvider, but a retained client is restored from
   * storage once: on later mounts its memory is already newer, and restoring
   * again would only hold its queries back while storage is read.
   */
  useEffect(() => {
    const options = {...persistOptions, queryClient}
    if (!isRestoring) return persistQueryClientSubscribe(options)
    let cancelled = false
    retained.restore ??= persistQueryClientRestore(options)
      .catch(() => {})
      .then(() => {
        retained.restored = true
      })
    void retained.restore.then(() => {
      if (!cancelled) setIsRestoring(false)
    })
    return () => {
      cancelled = true
    }
  }, [retained, queryClient, persistOptions, isRestoring])

  useEffect(() => {
    if (IS_WEB) {
      // WARNING, BROKEN
      // something since v5.32.0 causes OOMs. not important
      // so disable for now
      // window.__TANSTACK_QUERY_CLIENT__ = queryClient
    }
  }, [queryClient])
  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}

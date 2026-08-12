import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react'

type Listener = () => void

export type PdsViewabilityStore = ReturnType<typeof createPdsViewabilityStore>
export type PdsProfilePriority = 'off' | 'near' | 'visible'

export function createPdsViewabilityStore() {
  const prioritiesByDid = new Map<string, Exclude<PdsProfilePriority, 'off'>>()
  const listenersByDid = new Map<string, Set<Listener>>()

  function mark(
    dids: Iterable<string>,
    priority: Exclude<PdsProfilePriority, 'off'>,
  ) {
    for (const did of dids) {
      const current = prioritiesByDid.get(did)
      if (current === 'visible' || current === priority) continue

      prioritiesByDid.set(did, priority)
      listenersByDid.get(did)?.forEach(listener => listener())
      if (priority === 'visible') listenersByDid.delete(did)
    }
  }

  return {
    markNearViewport(dids: Iterable<string>) {
      mark(dids, 'near')
    },
    markVisible(dids: Iterable<string>) {
      mark(dids, 'visible')
    },
    getPriority(did: string): PdsProfilePriority {
      return prioritiesByDid.get(did) ?? 'off'
    },
    subscribe(did: string, listener: Listener) {
      let listeners = listenersByDid.get(did)
      if (!listeners) {
        listeners = new Set()
        listenersByDid.set(did, listeners)
      }
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) listenersByDid.delete(did)
      }
    },
  }
}

const PdsViewabilityContext = createContext<PdsViewabilityStore | null>(null)

export function PdsViewabilityProvider({
  children,
  store,
}: PropsWithChildren<{store: PdsViewabilityStore}>) {
  return (
    <PdsViewabilityContext.Provider value={store}>
      {children}
    </PdsViewabilityContext.Provider>
  )
}

/**
 * Profiles outside a virtualized feed resolve immediately. Inside a feed, a
 * profile is queued speculatively near the viewport and promoted when visible.
 */
export function usePdsProfilePriority(did: string): PdsProfilePriority {
  const store = useContext(PdsViewabilityContext)
  const subscribe = useCallback(
    (listener: Listener) => store?.subscribe(did, listener) ?? (() => {}),
    [did, store],
  )
  const getSnapshot = useCallback(
    () => store?.getPriority(did) ?? 'visible',
    [did, store],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

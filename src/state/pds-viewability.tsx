import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react'

type Listener = () => void

export type PdsViewabilityStore = ReturnType<typeof createPdsViewabilityStore>

export function createPdsViewabilityStore() {
  const viewableDids = new Set<string>()
  const listenersByDid = new Map<string, Set<Listener>>()

  return {
    markViewable(dids: Iterable<string>) {
      for (const did of dids) {
        if (viewableDids.has(did)) continue

        viewableDids.add(did)
        listenersByDid.get(did)?.forEach(listener => listener())
        listenersByDid.delete(did)
      }
    },
    isViewable(did: string) {
      return viewableDids.has(did)
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
 * profile becomes eligible once its row has met the list's viewability rules.
 */
export function useIsPdsProfileViewable(did: string) {
  const store = useContext(PdsViewabilityContext)
  const subscribe = useCallback(
    (listener: Listener) => store?.subscribe(did, listener) ?? (() => {}),
    [did, store],
  )
  const getSnapshot = useCallback(
    () => store?.isViewable(did) ?? true,
    [did, store],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

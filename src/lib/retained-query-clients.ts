/*
 * Each account keeps its own query client across account switches, so
 * switching back renders from memory instead of refetching every screen. The
 * least recently used clients beyond the cap are discarded.
 *
 * Discarding only forgets an entry: a provider may still have it mounted (a
 * logout discards the account being shown). `retire` runs at once so nothing
 * more is persisted for it; `dispose` frees it once it is also unmounted,
 * since TanStack's gc timers would otherwise keep a forgotten client alive.
 */

const MAX_RETAINED = 5

export type RetainedValue = {
  /** Stop writing to persistent storage. Runs as soon as it is discarded. */
  retire: () => void
  /** Free memory. Runs once it is discarded and no longer mounted. */
  dispose: () => void
}

type Entry = {
  value: RetainedValue
  mounts: number
  discarded: boolean
}

const retained = new Map<string, Entry>()

function discardEntry(entry: Entry) {
  if (entry.discarded) return
  entry.discarded = true
  entry.value.retire()
  if (entry.mounts === 0) entry.value.dispose()
}

/** Return the client kept for this key, creating it on first use. */
export function getRetainedQueryClient<T extends RetainedValue>(
  key: string,
  create: () => T,
): T {
  const entry = retained.get(key) ?? {
    value: create(),
    mounts: 0,
    discarded: false,
  }
  // Re-insert so iteration order tracks recency.
  retained.delete(key)
  retained.set(key, entry)
  while (retained.size > MAX_RETAINED) {
    const oldest = retained.keys().next().value!
    discardEntry(retained.get(oldest)!)
    retained.delete(oldest)
  }
  return entry.value as T
}

/**
 * Record that a provider mounted this value; call the result on unmount. A
 * value discarded while mounted is disposed by its last unmount.
 */
export function holdRetainedQueryClient(value: RetainedValue): () => void {
  const entry = [...retained.values()].find(e => e.value === value) ?? {
    // Already discarded before mounting: dispose on unmount.
    value,
    mounts: 0,
    discarded: true,
  }
  entry.mounts++
  return () => {
    entry.mounts--
    if (entry.discarded && entry.mounts === 0) entry.value.dispose()
  }
}

/** Forget an account's client so its next session starts empty. */
export function discardRetainedQueryClient(key: string) {
  const entry = retained.get(key)
  if (!entry) return
  retained.delete(key)
  discardEntry(entry)
}

/** Forget every account's client, optionally keeping one (e.g. the active). */
export function discardAllRetainedQueryClients({
  except,
}: {except?: string} = {}) {
  for (const [key, entry] of [...retained]) {
    if (key === except) continue
    retained.delete(key)
    discardEntry(entry)
  }
}

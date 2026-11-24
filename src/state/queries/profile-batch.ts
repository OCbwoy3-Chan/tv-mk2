import {type Client} from '@atproto/lex'
import {type AtIdentifierString} from '@atproto/syntax'

import {isNetworkError} from '#/lib/network-error'
import {app} from '#/lexicons'

type Profile = app.bsky.actor.defs.ProfileViewDetailed
type Waiter = {
  resolve: (profile: Profile) => void
  reject: (e: unknown) => void
}

/** How long to collect lookups before sending one getProfiles request. */
const BATCH_WINDOW_MS = 10
/** Maximum actors accepted by app.bsky.actor.getProfiles per request. */
const MAX_ACTORS = 25

/*
 * Pending lookups per appview client. Keyed by client so two accounts' (or a
 * logged-out and a logged-in) lookups never share a request.
 */
const batches = new WeakMap<Client, Map<string, Waiter[]>>()

/**
 * Fetch a profile by DID, coalescing lookups made within a few milliseconds
 * into getProfiles requests. A feed that mounts many reply-to names at once
 * then costs one request instead of one per name.
 */
export function fetchProfileBatched(client: Client, did: string) {
  let batch = batches.get(client)
  if (!batch) {
    const created = new Map<string, Waiter[]>()
    batches.set(client, created)
    setTimeout(() => {
      batches.delete(client)
      void flush(client, created)
    }, BATCH_WINDOW_MS)
    batch = created
  }
  const waiters = batch.get(did) ?? []
  batch.set(did, waiters)
  return new Promise<Profile>((resolve, reject) => {
    waiters.push({resolve, reject})
  })
}

async function flush(client: Client, batch: Map<string, Waiter[]>) {
  const dids = [...batch.keys()]
  const chunks: string[][] = []
  for (let i = 0; i < dids.length; i += MAX_ACTORS) {
    chunks.push(dids.slice(i, i + MAX_ACTORS))
  }
  const settle = (did: string, result: Promise<Profile>) => {
    for (const waiter of batch.get(did) ?? []) {
      result.then(waiter.resolve, waiter.reject)
    }
  }
  /*
   * The single-profile call reports why a profile is unavailable (deactivated,
   * taken down, ...) as its own typed error, which getProfiles just omits.
   */
  const single = (did: string) =>
    client.call(app.bsky.actor.getProfile, {
      actor: did as AtIdentifierString,
    })
  await Promise.all(
    chunks.map(async actors => {
      try {
        const res = await client.call(app.bsky.actor.getProfiles, {
          actors: actors as AtIdentifierString[],
        })
        const byDid = new Map(res.profiles.map(p => [p.did as string, p]))
        for (const did of actors) {
          const profile = byDid.get(did)
          settle(did, profile ? Promise.resolve(profile) : single(did))
        }
      } catch (e) {
        // Offline fails every lookup alike; anything else may be one bad actor.
        for (const did of actors) {
          if (isNetworkError(e)) {
            for (const waiter of batch.get(did) ?? []) waiter.reject(e)
          } else {
            settle(did, single(did))
          }
        }
      }
    }),
  )
}

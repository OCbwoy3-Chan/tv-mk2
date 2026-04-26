/**
 * TanStack Query hooks for reading and writing the Witchsky storage manifest
 * draft. The storage manifest is a single draft whose posts encode the
 * user's synced preferences as a gzip+u15 blob (see
 * src/lib/storage-manifest/codec.ts).
 */

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {decode, encode, isManifestSegment} from '#/lib/storage-manifest/codec'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {SYNCED_PREFS_KEYS} from '#/state/preferences/settings-sync'
import {useAgent, useSession} from '#/state/session'

// Keyed by DID so switching accounts never serves a stale result.
// Invalidations use the base key so they match any DID.
const STORAGE_MANIFEST_BASE_KEY = ['witchsky-storage-manifest'] as const
const storageManifestQueryKey = (did: string | undefined) =>
  [...STORAGE_MANIFEST_BASE_KEY, did] as const

// ---------------------------------------------------------------------------
// Finding the storage draft
// ---------------------------------------------------------------------------

/**
 * Page through the user's drafts looking for the storage manifest draft.
 * On each page we check the cached draft ID first (O(1) string compare) then
 * fall back to inspecting the first post's text.  Both checks happen inside
 * the same pagination loop so no extra round-trips are wasted regardless of
 * which page the draft lives on.
 */
async function findStorageDraft(
  agent: ReturnType<typeof useAgent>,
): Promise<{id: string; segments: string[]} | null> {
  const cachedId = persisted.get('settingsSyncDraftId')

  let cursor: string | undefined
  do {
    const res = await agent.app.bsky.draft.getDrafts({cursor})
    for (const draft of res.data.drafts) {
      const first = draft.draft.posts[0]?.text ?? ''

      // ID match: we already know this draft — just verify it's still a
      // storage draft (the user could have deleted and re-created one).
      if (cachedId && draft.id === cachedId) {
        if (isManifestSegment(first)) {
          return {
            id: draft.id,
            segments: draft.draft.posts.map(p => p.text ?? ''),
          }
        }
        // Stale cache — the draft no longer looks like a manifest.
        // Clear it and keep scanning for a manifest by text.
        await persisted.write('settingsSyncDraftId', undefined)
      }

      // Text match: first post starts with 'witchsky:storage\n'
      if (isManifestSegment(first)) {
        await persisted.write('settingsSyncDraftId', draft.id)
        return {
          id: draft.id,
          segments: draft.draft.posts.map(p => p.text ?? ''),
        }
      }
    }
    cursor = res.data.cursor
  } while (cursor)

  return null
}

// ---------------------------------------------------------------------------
// Query: read and decode the storage draft
// ---------------------------------------------------------------------------

/**
 * Fetches and decodes the storage manifest draft.
 * Returns the decoded object, or null if no storage draft exists.
 * Only runs when the user has a session.
 */
export function useStorageManifestQuery({enabled = true}: {enabled?: boolean} = {}) {
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useQuery({
    queryKey: storageManifestQueryKey(currentAccount?.did),
    queryFn: async () => {
      const found = await findStorageDraft(agent)
      if (!found) return null
      try {
        return decode(found.segments)
      } catch (e) {
        logger.error('storage-manifest: decode failed', {safeMessage: String(e)})
        throw e
      }
    },
    enabled,
    // Don't cache stale cloud data for too long; re-check on focus
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

// ---------------------------------------------------------------------------
// Mutation: push current prefs to cloud
// ---------------------------------------------------------------------------

/**
 * Reads the current persisted preferences, encodes them, and writes them to
 * the storage draft (creating it if it doesn't exist).
 */
export function usePushStorageManifestMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Collect all synced preference values
      const prefs: Record<string, unknown> = {}
      const syncApiKey = persisted.get('syncOpenRouterApiKey')
      for (const key of SYNCED_PREFS_KEYS) {
        if (key === 'openRouterApiKey' && !syncApiKey) continue
        prefs[key] = persisted.get(key)
      }

      const segments = encode(prefs)
      logger.debug('storage-manifest: pushing', {
        segments: segments.length,
        keys: SYNCED_PREFS_KEYS.length,
      })

      // Build a draft whose posts are the segments
      const posts = segments.map(text => ({
        $type: 'app.bsky.draft.defs#draftPost' as const,
        text,
      }))
      const draft = {
        $type: 'app.bsky.draft.defs#draft' as const,
        posts,
      }

      // Re-use findStorageDraft so we get the same paginated lookup and
      // stale-cache handling that the read path uses.
      const existing = await findStorageDraft(agent)

      if (existing) {
        await agent.app.bsky.draft.updateDraft({
          draft: {id: existing.id, draft},
        })
        return existing.id
      } else {
        const res = await agent.app.bsky.draft.createDraft({draft})
        return res.data.id
      }
    },
    onSuccess: async (draftId: string) => {
      await persisted.write('settingsSyncDraftId', draftId)
      queryClient.invalidateQueries({queryKey: STORAGE_MANIFEST_BASE_KEY})
      logger.debug('storage-manifest: push succeeded', {draftId})
    },
    onError: e => {
      logger.error('storage-manifest: push failed', {safeMessage: String(e)})
    },
  })
}

// ---------------------------------------------------------------------------
// Mutation: pull cloud prefs and apply to local
// ---------------------------------------------------------------------------

/**
 * Reads the storage draft from the cloud and applies the decoded preferences
 * to the local persisted store.  Only keys present in the decoded object are
 * written; missing keys (e.g. from an older manifest) are left untouched so
 * new preferences added in later versions aren't reset.
 */
export function usePullStorageManifestMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const found = await findStorageDraft(agent)
      if (!found) return null

      const decoded = decode(found.segments)
      if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('storage-manifest: decoded value is not an object')
      }
      return decoded as Record<string, unknown>
    },
    onSuccess: async (decoded: Record<string, unknown> | null) => {
      if (!decoded) {
        logger.debug('storage-manifest: pull found no storage draft')
        return
      }

      const syncApiKey = persisted.get('syncOpenRouterApiKey')

      let applied = 0
      for (const key of SYNCED_PREFS_KEYS) {
        // Skip openRouterApiKey if the user hasn't opted into syncing it
        if (key === 'openRouterApiKey' && !syncApiKey) continue
        if (Object.prototype.hasOwnProperty.call(decoded, key)) {
          // persisted.write is typed per-key; use the cast the same way
          // the persisted module itself does in normalizeData/tryParse
          await persisted.write(
            key,
            decoded[key] as persisted.Schema[typeof key],
          )
          applied++
        }
      }

      logger.debug('storage-manifest: pull applied', {applied})
      queryClient.invalidateQueries({queryKey: STORAGE_MANIFEST_BASE_KEY})
    },
    onError: e => {
      logger.error('storage-manifest: pull failed', {safeMessage: String(e)})
    },
  })
}

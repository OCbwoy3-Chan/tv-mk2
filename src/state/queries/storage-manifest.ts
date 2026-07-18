/**
 * TanStack Query hooks for reading and writing the Witchsky storage manifest
 * draft. The storage manifest is a single draft whose posts encode the
 * user's synced preferences as a gzip+u15 blob (see
 * src/lib/storage-manifest/codec.ts).
 */

import type AtpAgent from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import deepEqual from 'fast-deep-equal'

import {decode, encode, isManifestSegment} from '#/lib/storage-manifest/codec'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {getActiveSyncedPrefsKeys} from '#/state/preferences/settings-sync'
import {useAgent, useSession, useSessionApi} from '#/state/session'
import {type SessionAccount} from '#/state/session/types'
import {canAttemptSessionResume} from '#/state/session/util'

// Invalidations use this base key so they match any DID-scoped cache entry.
const STORAGE_MANIFEST_BASE_KEY = ['witchsky-storage-manifest'] as const

export type SyncAllAccountsFailure = {
  did: string
  handle: string
  reason: string
}

export type SyncAllAccountsProgress = {
  total: number
  completed: number
  currentHandle: string | undefined
  failures: SyncAllAccountsFailure[]
}

// ---------------------------------------------------------------------------
// Finding / writing the storage draft
// ---------------------------------------------------------------------------

/**
 * Page through the user's drafts looking for the storage manifest draft.
 * On each page we check the cached draft ID first (O(1) string compare) then
 * fall back to inspecting the first post's text.  Both checks happen inside
 * the same pagination loop so no extra round-trips are wasted regardless of
 * which page the draft lives on.
 *
 * When `persistDraftId` is false (multi-account push to a secondary account),
 * the shared `settingsSyncDraftId` cache is neither read nor written.
 */
async function findStorageDraft(
  agent: AtpAgent,
  {persistDraftId = true}: {persistDraftId?: boolean} = {},
): Promise<{id: string; segments: string[]} | null> {
  const cachedId = persistDraftId
    ? persisted.get('settingsSyncDraftId')
    : undefined

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
        if (persistDraftId) {
          await persisted.write('settingsSyncDraftId', draft.id)
        }
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

async function writeManifestToAgent(
  agent: AtpAgent,
  segments: string[],
  {persistDraftId = true}: {persistDraftId?: boolean} = {},
): Promise<string> {
  const posts = segments.map(text => ({
    $type: 'app.bsky.draft.defs#draftPost' as const,
    text,
  }))
  const draft = {
    $type: 'app.bsky.draft.defs#draft' as const,
    posts,
  }

  const existing = await findStorageDraft(agent, {persistDraftId})

  if (existing) {
    await agent.app.bsky.draft.updateDraft({
      draft: {id: existing.id, draft},
    })
    return existing.id
  }

  const res = await agent.app.bsky.draft.createDraft({draft})
  return res.data.id
}

function collectSyncedPrefs(): Record<string, unknown> {
  const prefs: Record<string, unknown> = {}
  for (const key of getActiveSyncedPrefsKeys()) {
    prefs[key] = persisted.get(key)
  }
  return prefs
}

/**
 * Merge cloud prefs into local: take cloud values where local is still at
 * the schema default (unchanged); keep local where the user has customized.
 */
export async function applyMergedCloudPrefs(
  cloud: Record<string, unknown>,
): Promise<{applied: number; keptLocal: number}> {
  let applied = 0
  let keptLocal = 0

  for (const key of getActiveSyncedPrefsKeys()) {
    if (!Object.prototype.hasOwnProperty.call(cloud, key)) continue

    const local = persisted.get(key)
    const cloudVal = cloud[key]
    if (deepEqual(local, cloudVal)) continue

    if (deepEqual(local, persisted.defaults[key])) {
      await persisted.write(key, cloudVal as persisted.Schema[typeof key])
      applied++
    } else {
      keptLocal++
    }
  }

  return {applied, keptLocal}
}

function accountLabel(account: SessionAccount): string {
  return account.handle || account.did
}

function errorReason(e: unknown): string {
  if (e instanceof Error && e.message) return e.message
  const s = String(e)
  // Avoid "Error: Error: …" when callers already prefix with "Error:".
  return s.replace(/^Error:\s*/i, '')
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
      const prefs = collectSyncedPrefs()
      const keys = getActiveSyncedPrefsKeys()
      const segments = encode(prefs)
      logger.debug('storage-manifest: pushing', {
        segments: segments.length,
        keys: keys.length,
      })

      return await writeManifestToAgent(agent, segments)
    },
    onSuccess: async (draftId: string) => {
      await persisted.write('settingsSyncDraftId', draftId)
      await queryClient.invalidateQueries({queryKey: STORAGE_MANIFEST_BASE_KEY})
      logger.debug('storage-manifest: push succeeded', {draftId})
    },
    onError: e => {
      logger.error('storage-manifest: push failed', {safeMessage: String(e)})
    },
  })
}

// ---------------------------------------------------------------------------
// Mutation: merge cloud prefs with local, then push
// ---------------------------------------------------------------------------

/**
 * Loads the cloud draft (if any), merges it with local prefs (local custom
 * values win; cloud fills in keys still at defaults), then pushes the
 * merged result.
 */
export function useMergeAndSyncStorageManifestMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const found = await findStorageDraft(agent)
      if (found) {
        const decoded = decode(found.segments)
        if (typeof decoded !== 'object' || decoded === null) {
          throw new Error('storage-manifest: decoded value is not an object')
        }
        const {applied, keptLocal} = await applyMergedCloudPrefs(
          decoded as Record<string, unknown>,
        )
        logger.debug('storage-manifest: merge applied', {applied, keptLocal})
      } else {
        logger.debug('storage-manifest: merge found no storage draft')
      }

      const segments = encode(collectSyncedPrefs())
      return await writeManifestToAgent(agent, segments)
    },
    onSuccess: async (draftId: string) => {
      await persisted.write('settingsSyncDraftId', draftId)
      await queryClient.invalidateQueries({queryKey: STORAGE_MANIFEST_BASE_KEY})
      logger.debug('storage-manifest: merge-and-sync succeeded', {draftId})
    },
    onError: e => {
      logger.error('storage-manifest: merge-and-sync failed', {
        safeMessage: String(e),
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Mutation: sync current prefs to every logged-in account
// ---------------------------------------------------------------------------

/**
 * Writes the current synced prefs to the storage draft on every logged-in
 * account that can resume a session. Reports progress via `onProgress`.
 *
 * Uses `createEphemeralAgent` so OAuth accounts work the same as password
 * sessions (plain `AtpAgent.resumeSession` cannot restore OAuth).
 */
export function useSyncSettingsToAllAccountsMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const {createEphemeralAgent} = useSessionApi()

  return useMutation({
    mutationFn: async ({
      onProgress,
    }: {
      onProgress: (progress: SyncAllAccountsProgress) => void
    }) => {
      const segments = encode(collectSyncedPrefs())
      const {accounts} = persisted.get('session')
      const targets = accounts.filter(canAttemptSessionResume)

      const failures: SyncAllAccountsFailure[] = []
      let completed = 0

      const report = (currentHandle: string | undefined) => {
        onProgress({
          total: targets.length,
          completed,
          currentHandle,
          failures: [...failures],
        })
      }

      report(undefined)

      for (const account of targets) {
        const handle = accountLabel(account)
        report(handle)

        try {
          if (account.did === currentAccount?.did) {
            const draftId = await writeManifestToAgent(agent, segments)
            await persisted.write('settingsSyncDraftId', draftId)
          } else {
            const ephemeralAgent = await createEphemeralAgent(account)
            await writeManifestToAgent(ephemeralAgent, segments, {
              persistDraftId: false,
            })
          }
        } catch (e) {
          failures.push({
            did: account.did,
            handle,
            reason: errorReason(e),
          })
          logger.error('storage-manifest: sync-all account failed', {
            did: account.did,
            safeMessage: errorReason(e),
          })
        }

        completed++
        report(handle)
      }

      return {failures, total: targets.length}
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: STORAGE_MANIFEST_BASE_KEY})
    },
    onError: e => {
      logger.error('storage-manifest: sync-all failed', {
        safeMessage: String(e),
      })
    },
  })
}

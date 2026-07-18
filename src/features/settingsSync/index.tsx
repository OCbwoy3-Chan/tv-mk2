/**
 * Cloud sync feature module.
 *
 * Provides:
 *   - SettingsSyncGate   — drop into the provider tree (inside QueryProvider,
 *                        after session is available).  On enable / startup,
 *                        merges any cloud draft with local prefs then pushes.
 *   - useSettingsSyncStatus  — current sync state for UI
 *   - useSyncSettingsToAllAccounts — push current prefs to every account
 *   - usePrepareSettingsSyncForRestart — flush before app restart
 *
 * The gate does NOT re-export settingsSyncEnabled / useSetSettingsSyncEnabled; those
 * come from '#/state/preferences' as normal preference hooks.
 */

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {useSettingsSyncEnabled} from '#/state/preferences'
import {SYNCED_PREFS_KEYS} from '#/state/preferences/settings-sync'
import {
  type SyncAllAccountsProgress,
  useMergeAndSyncStorageManifestMutation,
  usePushStorageManifestMutation,
  useSyncSettingsToAllAccountsMutation,
} from '#/state/queries/storage-manifest'
import {useSession} from '#/state/session'

const AUTO_PUSH_DEBOUNCE_MS = 2000
// After a merge writes keys, suppress the debounced push that would
// otherwise re-upload mid-merge; the merge mutation pushes when done.
const POST_PULL_COOLDOWN_MS = AUTO_PUSH_DEBOUNCE_MS + 500

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

export type SyncStatus =
  | {type: 'idle'}
  | {type: 'pushing'}
  | {type: 'merging'}
  | {type: 'pushed'; at: Date}
  | {type: 'merged'; at: Date}
  | {type: 'error'; message: string}

export type SyncAllAccountsState =
  | {type: 'idle'}
  | {type: 'running'; progress: SyncAllAccountsProgress}
  | {
      type: 'done'
      progress: SyncAllAccountsProgress
    }

type SettingsSyncContextValue = {
  status: SyncStatus
  syncAllState: SyncAllAccountsState
  syncSettingsToAllAccounts: () => void
  flushPushToCloud: () => Promise<void>
  prepareForRestart: () => Promise<void>
}

const SettingsSyncContext = createContext<SettingsSyncContextValue>({
  status: {type: 'idle'},
  syncAllState: {type: 'idle'},
  syncSettingsToAllAccounts: () => {},
  flushPushToCloud: async () => {},
  prepareForRestart: async () => {},
})
SettingsSyncContext.displayName = 'SettingsSyncContext'

// ---------------------------------------------------------------------------
// Gate / Provider
// ---------------------------------------------------------------------------

/**
 * Mount this component inside QueryProvider (so TanStack Query hooks work)
 * and after SessionProvider. It handles the startup merge-and-sync and exposes
 * the sync status context to descendant settings screens.
 */
export function SettingsSyncGate({children}: PropsWithChildren<{}>) {
  const {hasSession, currentAccount} = useSession()
  const currentDid = currentAccount?.did
  const settingsSyncEnabled = useSettingsSyncEnabled()

  const pushMutation = usePushStorageManifestMutation()
  const mergeMutation = useMergeAndSyncStorageManifestMutation()
  const syncAllMutation = useSyncSettingsToAllAccountsMutation()

  const [status, setStatus] = useState<SyncStatus>({type: 'idle'})
  const [syncAllState, setSyncAllState] = useState<SyncAllAccountsState>({
    type: 'idle',
  })

  // Track whether we've already merged for this DID
  const hasMergedRef = useRef(false)
  const lastDidRef = useRef<string | undefined>(undefined)
  // Debounce handle and merge-cooldown timestamp for auto-push
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMergeAtRef = useRef(0)

  // When the account DID changes, clear the cached draft ID (it belongs to
  // the previous account) and reset the merge guard so we merge fresh data.
  useEffect(() => {
    if (currentDid === lastDidRef.current) return
    lastDidRef.current = currentDid
    hasMergedRef.current = false
    setStatus({type: 'idle'})
    if (currentDid) {
      // The cached draft ID is per-account; don't let the old one mislead
      // findStorageDraft into a false fast-path hit on the new account.
      void persisted.write('settingsSyncDraftId', undefined)
    }
  }, [currentDid])

  const flushPushToCloud = useCallback(async () => {
    if (!settingsSyncEnabled || !hasSession) return

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current)
      pushTimerRef.current = null
    }

    setStatus({type: 'pushing'})
    await pushMutation.mutateAsync()
    setStatus({type: 'pushed', at: new Date()})
  }, [settingsSyncEnabled, hasSession, pushMutation])

  const prepareForRestart = useCallback(async () => {
    if (!settingsSyncEnabled || !hasSession) return

    try {
      await flushPushToCloud()
    } catch (e) {
      logger.error('settings-sync: pre-restart push failed', {
        safeMessage: String(e),
      })
    }

    await persisted.write('settingsSyncSkipNextPull', true)
  }, [settingsSyncEnabled, hasSession, flushPushToCloud])

  // Merge cloud draft with local prefs (then push) once per account when
  // sync is enabled. Local custom values win; cloud fills defaults.
  useEffect(() => {
    if (!hasSession || !settingsSyncEnabled || hasMergedRef.current) return
    hasMergedRef.current = true

    if (persisted.get('settingsSyncSkipNextPull')) {
      void persisted.write('settingsSyncSkipNextPull', false)
      logger.debug('settings-sync: skipped startup merge after restart', {
        did: currentDid,
      })
      return
    }

    logger.debug('settings-sync: merge-and-sync on enable/startup', {
      did: currentDid,
    })
    setStatus({type: 'merging'})
    lastMergeAtRef.current = Date.now()
    mergeMutation.mutate(undefined, {
      onSuccess: () => {
        lastMergeAtRef.current = Date.now()
        setStatus({type: 'merged', at: new Date()})
        logger.debug('settings-sync: merge-and-sync applied')
      },
      onError: e => {
        setStatus({
          type: 'error',
          message: e instanceof Error ? e.message : String(e),
        })
      },
    })
    // mergeMutation is stable (from useMutation); no re-run risk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession, settingsSyncEnabled, currentDid])

  // Reset the merge guard when the user toggles settings sync off then on again
  useEffect(() => {
    if (!settingsSyncEnabled) {
      hasMergedRef.current = false
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
      setStatus({type: 'idle'})
      setSyncAllState({type: 'idle'})
    }
  }, [settingsSyncEnabled])

  // Auto-push: subscribe to every synced key and debounce writes to cloud.
  // Skips the push window immediately after a merge to avoid re-uploading
  // while merge writes settle (merge already pushes when finished).
  useEffect(() => {
    if (!settingsSyncEnabled || !hasSession) return

    const scheduleSync = () => {
      if (Date.now() - lastMergeAtRef.current < POST_PULL_COOLDOWN_MS) return
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
      pushTimerRef.current = setTimeout(() => {
        pushTimerRef.current = null
        logger.debug('settings-sync: auto-pushing after preference change')
        pushMutation.mutate(undefined, {
          onSuccess: () => setStatus({type: 'pushed', at: new Date()}),
          onError: e =>
            setStatus({
              type: 'error',
              message: e instanceof Error ? e.message : String(e),
            }),
        })
      }, AUTO_PUSH_DEBOUNCE_MS)
    }

    const unsubs = SYNCED_PREFS_KEYS.map(key =>
      persisted.onUpdate(key, scheduleSync),
    )
    return () => {
      unsubs.forEach(unsub => unsub())
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    }
    // pushMutation.mutate is stable; currentDid triggers a new subscription
    // when the account changes so the old timer can't fire for the new account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsSyncEnabled, hasSession, currentDid])

  const syncSettingsToAllAccounts = useCallback(() => {
    if (syncAllMutation.isPending) return

    setSyncAllState({
      type: 'running',
      progress: {
        total: 0,
        completed: 0,
        currentHandle: undefined,
        failures: [],
      },
    })

    syncAllMutation.mutate(
      {
        onProgress: progress => {
          setSyncAllState({type: 'running', progress})
        },
      },
      {
        onSuccess: result => {
          setSyncAllState(prev => {
            const progress =
              prev.type === 'running' || prev.type === 'done'
                ? prev.progress
                : {
                    total: result.total,
                    completed: result.total,
                    currentHandle: undefined,
                    failures: result.failures,
                  }
            return {
              type: 'done',
              progress: {
                ...progress,
                completed: result.total,
                failures: result.failures,
                currentHandle: undefined,
              },
            }
          })
          setStatus({type: 'pushed', at: new Date()})
        },
        onError: e => {
          setSyncAllState({type: 'idle'})
          setStatus({
            type: 'error',
            message: e instanceof Error ? e.message : String(e),
          })
        },
      },
    )
  }, [syncAllMutation])

  return (
    <SettingsSyncContext.Provider
      value={{
        status,
        syncAllState,
        syncSettingsToAllAccounts,
        flushPushToCloud,
        prepareForRestart,
      }}>
      {children}
    </SettingsSyncContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSettingsSyncStatus() {
  return useContext(SettingsSyncContext).status
}

export function useSyncAllAccountsState() {
  return useContext(SettingsSyncContext).syncAllState
}

export function useSyncSettingsToAllAccounts() {
  return useContext(SettingsSyncContext).syncSettingsToAllAccounts
}

export function usePrepareSettingsSyncForRestart() {
  return useContext(SettingsSyncContext).prepareForRestart
}

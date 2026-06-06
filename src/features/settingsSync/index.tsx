/**
 * Cloud sync feature module.
 *
 * Provides:
 *   - SettingsSyncGate   — drop into the provider tree (inside QueryProvider,
 *                        after session is available).  Auto-pulls on startup
 *                        when settings sync is enabled and a session exists.
 *   - useSettingsSyncStatus  — current sync state for UI
 *   - usePushToCloud      — trigger a push manually
 *   - usePullFromCloud    — trigger a pull manually
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
  usePullStorageManifestMutation,
  usePushStorageManifestMutation,
} from '#/state/queries/storage-manifest'
import {useSession} from '#/state/session'

const AUTO_PUSH_DEBOUNCE_MS = 2000
// After a pull writes all keys, suppress the debounced push that would
// otherwise re-upload the data we just downloaded.
const POST_PULL_COOLDOWN_MS = AUTO_PUSH_DEBOUNCE_MS + 500

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

export type SyncStatus =
  | {type: 'idle'}
  | {type: 'pushing'}
  | {type: 'pulling'}
  | {type: 'pushed'; at: Date}
  | {type: 'pulled'; at: Date}
  | {type: 'error'; message: string}

type SettingsSyncContextValue = {
  status: SyncStatus
  pushToCloud: () => void
  pullFromCloud: () => void
  flushPushToCloud: () => Promise<void>
  prepareForRestart: () => Promise<void>
}

const SettingsSyncContext = createContext<SettingsSyncContextValue>({
  status: {type: 'idle'},
  pushToCloud: () => {},
  pullFromCloud: () => {},
  flushPushToCloud: async () => {},
  prepareForRestart: async () => {},
})
SettingsSyncContext.displayName = 'SettingsSyncContext'

// ---------------------------------------------------------------------------
// Gate / Provider
// ---------------------------------------------------------------------------

/**
 * Mount this component inside QueryProvider (so TanStack Query hooks work)
 * and after SessionProvider. It handles the startup auto-pull and exposes
 * the sync status context to descendant settings screens.
 */
export function SettingsSyncGate({children}: PropsWithChildren<{}>) {
  const {hasSession, currentAccount} = useSession()
  const currentDid = currentAccount?.did
  const settingsSyncEnabled = useSettingsSyncEnabled()

  const pushMutation = usePushStorageManifestMutation()
  const pullMutation = usePullStorageManifestMutation()

  const [status, setStatus] = useState<SyncStatus>({type: 'idle'})

  // Track whether we've already auto-pulled for this DID
  const hasPulledRef = useRef(false)
  const lastDidRef = useRef<string | undefined>(undefined)
  // Debounce handle and pull-cooldown timestamp for auto-push
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPullAtRef = useRef(0)

  // When the account DID changes, clear the cached draft ID (it belongs to
  // the previous account) and reset the pull guard so we pull fresh data.
  useEffect(() => {
    if (currentDid === lastDidRef.current) return
    lastDidRef.current = currentDid
    hasPulledRef.current = false
    setStatus({type: 'idle'})
    if (currentDid) {
      // The cached draft ID is per-account; don't let the old one mislead
      // findStorageDraft into a false fast-path hit on the new account.
      persisted.write('settingsSyncDraftId', undefined)
    }
  }, [currentDid])

  const flushPushToCloud = useCallback(async () => {
    if (!settingsSyncEnabled || !hasSession) return

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current)
      pushTimerRef.current = null
    }

    setStatus({type: 'pushing'})
    await pushMutation.mutateAsync(undefined)
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

  // Auto-pull once per account when we have a session and sync is enabled
  useEffect(() => {
    if (!hasSession || !settingsSyncEnabled || hasPulledRef.current) return
    hasPulledRef.current = true

    if (persisted.get('settingsSyncSkipNextPull')) {
      void persisted.write('settingsSyncSkipNextPull', false)
      logger.debug('settings-sync: skipped startup pull after restart', {
        did: currentDid,
      })
      return
    }

    logger.debug('settings-sync: auto-pulling on startup', {did: currentDid})
    setStatus({type: 'pulling'})
    pullMutation.mutate(undefined, {
      onSuccess: decoded => {
        lastPullAtRef.current = Date.now()
        if (decoded) {
          setStatus({type: 'pulled', at: new Date()})
          logger.debug('settings-sync: startup pull applied')
        } else {
          setStatus({type: 'idle'})
        }
      },
      onError: e => {
        setStatus({type: 'error', message: String(e)})
      },
    })
    // pullMutation is stable (from useMutation); no re-run risk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession, settingsSyncEnabled, currentDid])

  // Reset the pull guard when the user toggles settings sync off then on again
  useEffect(() => {
    if (!settingsSyncEnabled) {
      hasPulledRef.current = false
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
      setStatus({type: 'idle'})
    }
  }, [settingsSyncEnabled])

  // Auto-push: subscribe to every synced key and debounce writes to cloud.
  // Skips the push window immediately after a pull to avoid re-uploading
  // data we just downloaded.
  useEffect(() => {
    if (!settingsSyncEnabled || !hasSession) return

    const scheduleSync = () => {
      if (Date.now() - lastPullAtRef.current < POST_PULL_COOLDOWN_MS) return
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
      pushTimerRef.current = setTimeout(() => {
        pushTimerRef.current = null
        logger.debug('settings-sync: auto-pushing after preference change')
        pushMutation.mutate(undefined, {
          onSuccess: () => setStatus({type: 'pushed', at: new Date()}),
          onError: e => setStatus({type: 'error', message: String(e)}),
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

  const pushToCloud = useCallback(() => {
    setStatus({type: 'pushing'})
    pushMutation.mutate(undefined, {
      onSuccess: () => setStatus({type: 'pushed', at: new Date()}),
      onError: e => setStatus({type: 'error', message: String(e)}),
    })
  }, [pushMutation])

  const pullFromCloud = useCallback(() => {
    setStatus({type: 'pulling'})
    pullMutation.mutate(undefined, {
      onSuccess: decoded => {
        lastPullAtRef.current = Date.now()
        if (decoded) {
          setStatus({type: 'pulled', at: new Date()})
        } else {
          setStatus({type: 'error', message: 'No cloud settings found'})
        }
      },
      onError: e => setStatus({type: 'error', message: String(e)}),
    })
  }, [pullMutation])

  return (
    <SettingsSyncContext.Provider
      value={{
        status,
        pushToCloud,
        pullFromCloud,
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

export function usePushToCloud() {
  return useContext(SettingsSyncContext).pushToCloud
}

export function usePullFromCloud() {
  return useContext(SettingsSyncContext).pullFromCloud
}

export function usePrepareSettingsSyncForRestart() {
  return useContext(SettingsSyncContext).prepareForRestart
}

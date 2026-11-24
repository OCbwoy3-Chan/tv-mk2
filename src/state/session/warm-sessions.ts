import {isNetworkError} from '#/lib/network-error'
import {logger} from '#/logger'
import {readAppViewProxy} from '#/state/preferences/custom-appview-did'
import {com} from '#/lexicons'
import {restoreOAuthSession} from './oauth-client-adapter'
import {hasOAuthAppViewScope} from './oauth-config'
import {createOAuthSessionBundleAndResume} from './oauth-session-bundle'
import {type OAuthSessionBundle} from './session-core'
import {type SessionAccount} from './types'
import {WARM_SESSIONS_ENABLED} from './warm-sessions-enabled'

/*
 * Resumed OAuth sessions for saved accounts that are not active, so switching
 * to one can swap bundles synchronously instead of restoring the session and
 * round-tripping getSession first. Only OAuth bundles are kept: they hold no
 * tokens of their own, while a retained PasswordSession could rotate a refresh
 * token no one tracks.
 *
 * Entries are leases: taking one removes it, and nothing taken is ever put
 * back, so an invalidation (logout, removal, reauthorization, AppView change)
 * that lands while a switch is in flight cannot be undone by it.
 *
 * Web only. The web transport restores the current grant on every request,
 * so a kept bundle always signs with the current key. A native bundle is the
 * raw OAuthSession, which keeps the DPoP key it was built with while reading
 * tokens by DID: after the grant is replaced it would sign new tokens with the
 * old key, and repeated invalid_token responses make the SDK delete the fresh
 * grant.
 */

/** Bounds waits on the browser's session lock, which has no deadline of its own. */
const WAIT_TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>): Promise<T | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise,
    new Promise<'timeout'>(resolve => {
      timer = setTimeout(() => resolve('timeout'), WAIT_TIMEOUT_MS)
    }),
  ]).finally(() => clearTimeout(timer))
}

export type WarmSession = {
  account: SessionAccount
  bundle: OAuthSessionBundle
}

const entries = new Map<string, Promise<WarmSession>>()

function add(did: string, session: Promise<WarmSession>) {
  entries.set(did, session)
  session.catch(e => {
    if (entries.get(did) === session) entries.delete(did)
    logger.warn('session: failed to warm saved account', {
      message: e instanceof Error ? e.message : String(e),
    })
  })
}

/** Start resuming every saved OAuth account that has no warm session yet. */
export function warmSessions(accounts: SessionAccount[]) {
  if (!WARM_SESSIONS_ENABLED) return
  for (const account of accounts) {
    if (!account.isOauthSession || entries.has(account.did)) continue
    add(account.did, createOAuthSessionBundleAndResume(account))
  }
}

/** Keep an outgoing account's live bundle so switching back is instant. */
export function retainWarmSession(
  account: SessionAccount,
  bundle: OAuthSessionBundle,
) {
  if (!WARM_SESSIONS_ENABLED) return
  add(account.did, Promise.resolve({account, bundle}))
}

/**
 * Remove and return the account's warm session, waiting for one that is still
 * resuming. Resolves to undefined when there is none, it failed, it was
 * invalidated while resuming, or its clients target a different AppView than
 * the one now selected.
 */
export async function takeWarmSession(
  did: string,
): Promise<WarmSession | undefined> {
  const session = entries.get(did)
  if (!session) return undefined
  entries.delete(did)
  let warm: WarmSession | 'timeout'
  try {
    // A resume stuck on the session lock falls back to the cold path.
    warm = await withTimeout(session)
  } catch {
    return undefined
  }
  if (warm === 'timeout') return undefined
  return warm.bundle.appview === readAppViewProxy() ? warm : undefined
}

/** Drop warm sessions for accounts that are no longer warmable. */
export function pruneWarmSessions(keep: (did: string) => boolean) {
  for (const did of [...entries.keys()]) {
    if (!keep(did)) entries.delete(did)
  }
}

export function forgetWarmSession(did: string) {
  entries.delete(did)
}

export function clearWarmSessions() {
  entries.clear()
}

export type WarmSessionVerdict =
  | {
      status: 'valid'
      /** Account fields as the server just returned them. */
      fresh: Pick<
        SessionAccount,
        | 'handle'
        | 'email'
        | 'emailConfirmed'
        | 'emailAuthFactor'
        | 'active'
        | 'status'
      >
    }
  /** Offline, timed out, or similar: nothing says the session is bad. */
  | {status: 'unknown'}
  /** The grant is gone, lacks the AppView scope, or the PDS refused it. */
  | {status: 'invalid'; error: unknown}

/**
 * Confirm an activated warm session the way a cold restore would: restore the
 * stored grant (refreshing it if due), check its AppView scope, and call
 * getSession through the bundle's own clients. The bundle is checked rather
 * than a fresh session so a stale signing key (e.g. after the account was
 * reauthorized on native) shows up here as a refusal.
 */
export async function verifyWarmSession(
  warm: WarmSession,
): Promise<WarmSessionVerdict> {
  const verdict = await withTimeout(verify(warm))
  return verdict === 'timeout' ? {status: 'unknown'} : verdict
}

async function verify({
  account,
  bundle,
}: WarmSession): Promise<WarmSessionVerdict> {
  try {
    const session = await restoreOAuthSession(account.did)
    const {scope} = await session.getTokenInfo(false)
    if (!hasOAuthAppViewScope(scope, bundle.appview)) {
      return {
        status: 'invalid',
        error: new Error('Missing the selected app server scope'),
      }
    }
    const data = await bundle.pdsClient.call(com.atproto.server.getSession, {})
    return {
      status: 'valid',
      fresh: {
        handle: data.handle,
        email: data.email,
        emailConfirmed: data.emailConfirmed,
        emailAuthFactor: data.emailAuthFactor,
        active: data.active,
        status: data.status,
      },
    }
  } catch (error) {
    return isNetworkError(error)
      ? {status: 'unknown'}
      : {status: 'invalid', error}
  }
}

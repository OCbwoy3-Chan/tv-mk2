import {isDid} from '@atproto/api'
import {type OAuthSession} from '@atproto/oauth-client-browser'

import {device} from '#/storage'
import {restoreOAuthSession} from './oauth-client-adapter'
import {buildOAuthScope, hasOAuthAppViewScope} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'
import {getWebOAuthClient} from './oauth-web-client'

type Selection = {did?: string; url?: string}
type PendingSwitch = {
  mode?: 'popup'
  account: string
  state: string
  selection: Selection
  previous: Selection
  audiences: {appview: string; chat: string}
}
const KEY = 'oauth_appview_switch'

function readPending(): PendingSwitch | undefined {
  const saved = window.sessionStorage.getItem(KEY)
  return saved ? JSON.parse(saved) : undefined
}

function applySelection(selection: Selection) {
  device.set(['customAppViewDid'], selection.did)
  device.set(['customAppViewUrl'], selection.url)
}

/** Keep the source document active until the new grant is ready. */
export async function startAppViewSwitch(
  account: string,
  selection: Selection,
  login: (session: OAuthSession) => Promise<void>,
) {
  const audiences: PendingSwitch['audiences'] = getOAuthAudiences()
  if (selection.did && !isDid(selection.did)) {
    throw new Error('Invalid AppView DID')
  }
  audiences.appview = selection.did
    ? `${selection.did}#bsky_appview`
    : 'did:web:api.bsky.app#bsky_appview'
  const pending: PendingSwitch = {
    mode: 'popup',
    account,
    state: crypto.randomUUID(),
    selection,
    previous: {
      did: device.get(['customAppViewDid']),
      url: device.get(['customAppViewUrl']),
    },
    audiences,
  }
  /*
   * The popup inherits sessionStorage before leaving about:blank. Its callback
   * needs the target client metadata, while the source keeps its old routing.
   */
  window.sessionStorage.setItem(KEY, JSON.stringify(pending))
  try {
    const session = await getWebOAuthClient(audiences).signIn(account, {
      scope: buildOAuthScope(audiences.appview, audiences.chat),
      display: 'popup',
    })
    if (session.did !== account) {
      throw new Error('Unexpected OAuth account or AppView switch')
    }
    const {scope} = await session.getTokenInfo(false)
    if (!hasOAuthAppViewScope(scope, audiences.appview)) {
      throw new Error(
        'Please authorize this account for the selected app server',
      )
    }
    /*
     * Consent has replaced the old grant. Keep routing aligned with the new
     * grant even if loading the account fails and needs to be retried.
     */
    applySelection(selection)
    await login(session)
  } finally {
    if (readPending()?.state === pending.state) {
      window.sessionStorage.removeItem(KEY)
    }
  }
}

/** Read once before the SDK removes the callback parameters from the URL. */
export function readOAuthCallbackParams(): URLSearchParams | undefined {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  for (const params of [hash, query]) {
    if (params.has('state') && (params.has('code') || params.has('error'))) {
      return params
    }
  }
}

let completion: Promise<boolean> | undefined

/** Startup and the callback route must share a single authorization exchange. */
export function completeWebOAuth(
  login: (session: OAuthSession) => Promise<void>,
): Promise<boolean> {
  if (completion) return completion
  const params = readOAuthCallbackParams()
  if (!params) return Promise.resolve(false)
  const operation = completeCallback(params, login)
  completion = operation
  const clear = () => {
    if (completion === operation) completion = undefined
  }
  void operation.then(clear, clear)
  return operation
}

async function completeCallback(
  params: URLSearchParams,
  login: (session: OAuthSession) => Promise<void>,
) {
  const pending = readPending()
  try {
    const client = getWebOAuthClient(pending?.audiences)
    const result = await client.initCallback(params)
    if (pending) {
      /* Popup completion is handed to signIn() by the SDK, never logged in here. */
      if (
        pending.mode === 'popup' ||
        result.state !== pending.state ||
        result.session.did !== pending.account
      ) {
        throw new Error('Unexpected OAuth account or AppView switch')
      }
      // Finish redirects started by clients running the previous version.
      applySelection(pending.selection)
    }
    await login(result.session)
    return true
  } finally {
    window.sessionStorage.removeItem(KEY)
  }
}

/** A stalled browser document must not leave the account chooser pending forever. */
export class OAuthSessionBusyError extends Error {
  constructor() {
    super('Timed out waiting for the OAuth session in another browser document')
    this.name = 'OAuthSessionBusyError'
  }
}

/** Bound the lock wait without interrupting another document's token refresh. */
export async function ensureAppViewAccess(account: string) {
  const checkAccess = async () => {
    try {
      const session = await restoreOAuthSession(account)
      const {scope} = await session.getTokenInfo(false)
      return hasOAuthAppViewScope(scope, getOAuthAudiences().appview)
    } catch {
      return false
    }
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      checkAccess(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new OAuthSessionBusyError()), 10_000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

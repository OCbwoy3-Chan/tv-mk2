import {isDid} from '@atproto/api'
import {type OAuthSession} from '@atproto/oauth-client-browser'

import {device} from '#/storage'
import {restoreOAuthSession} from './oauth-client-adapter'
import {buildOAuthScope, hasOAuthAppViewScope} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'
import {getWebOAuthClient} from './oauth-web-client'
import {saveOAuthReturnUrl} from './oauth-web-return-url'

type Selection = {did?: string; url?: string}
type PendingSwitch = {
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

/** Keep the current routing and session intact until the PDS grants access. */
export async function startAppViewSwitch(account: string, selection: Selection) {
  const audiences: PendingSwitch['audiences'] = getOAuthAudiences()
  if (selection.did && !isDid(selection.did)) {
    throw new Error('Invalid AppView DID')
  }
  audiences.appview = selection.did
    ? `${selection.did}#bsky_appview`
    : 'did:web:api.bsky.app#bsky_appview'
  const pending: PendingSwitch = {
    account,
    state: crypto.randomUUID(),
    selection,
    previous: {
      did: device.get(['customAppViewDid']),
      url: device.get(['customAppViewUrl']),
    },
    audiences,
  }
  window.sessionStorage.setItem(KEY, JSON.stringify(pending))
  saveOAuthReturnUrl()
  try {
    await getWebOAuthClient(audiences).signIn(account, {
      scope: buildOAuthScope(audiences.appview, audiences.chat),
      state: pending.state,
    })
  } catch (error) {
    window.sessionStorage.removeItem(KEY)
    throw error
  }
}

/** Match the callback to its requested server before constructing the agent. */
export async function completeWebOAuth(
  login: (session: OAuthSession) => Promise<void>,
) {
  const pending = readPending()
  let applied = false
  try {
    const result = await getWebOAuthClient(pending?.audiences).init()
    if (!result?.session) return false
    if (pending) {
      if (
        result.state !== pending.state ||
        result.session.did !== pending.account
      ) {
        throw new Error('Unexpected OAuth account or AppView switch')
      }
      applySelection(pending.selection)
      applied = true
    }
    await login(result.session)
    return true
  } catch (error) {
    if (applied && pending) applySelection(pending.previous)
    throw error
  } finally {
    window.sessionStorage.removeItem(KEY)
  }
}

/** Check a saved grant without navigating; the caller can offer login in place. */
export async function ensureAppViewAccess(account: string) {
  try {
    const session = await restoreOAuthSession(account)
    const {scope} = await session.getTokenInfo(false)
    return hasOAuthAppViewScope(scope, getOAuthAudiences().appview)
  } catch {
    return false
  }
}

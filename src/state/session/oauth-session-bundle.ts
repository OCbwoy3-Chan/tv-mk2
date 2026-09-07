import {type OAuthSession} from '@atproto/oauth-client-browser'

import {buildAppviewClient, buildChatClient, buildPdsClient} from './clients'
import {configureModerationForAccount} from './moderation'
import {oauthCreateAgent, oauthResumeSession} from './oauth-agent'
import {type OAuthSessionBundle} from './session-core'
import {type SessionAccount} from './types'

function buildOAuthBundle(
  oauthAgent: OAuthSessionBundle['oauthAgent'],
  account: SessionAccount,
): OAuthSessionBundle {
  // Use the raw session so the compatibility agent cannot append its own
  // proxy and moderation headers to those already produced by the client.
  const authAgent = oauthAgent.sessionManager
  return {
    session: null,
    oauthAgent,
    appviewClient: buildAppviewClient(authAgent),
    pdsClient: buildPdsClient(authAgent),
    chatClient: buildChatClient(authAgent),
    service: new URL(account.service),
  }
}

export async function createOAuthSessionBundleAndLogin(
  oauthSession: OAuthSession,
): Promise<{account: SessionAccount; bundle: OAuthSessionBundle}> {
  const {agent, account} = await oauthCreateAgent(oauthSession)
  const bundle = buildOAuthBundle(agent, account)
  await configureModerationForAccount(bundle, account)
  return {account, bundle}
}

export async function createOAuthSessionBundleAndResume(
  storedAccount: SessionAccount,
): Promise<{account: SessionAccount; bundle: OAuthSessionBundle}> {
  const {agent, account} = await oauthResumeSession(storedAccount)
  const bundle = buildOAuthBundle(agent, account)
  await configureModerationForAccount(bundle, account)
  return {account, bundle}
}

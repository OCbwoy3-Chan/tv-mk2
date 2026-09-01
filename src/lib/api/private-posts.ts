import {
  type AppBskyRichtextFacet,
  type AtpAgent as AtpAgentType,
} from '@atproto/api'

import {pdsAgent} from '#/state/session/agent'

export const PRIVATE_POSTS_MOD_STATUS_METHOD =
  'party.tenna.private.getModStatus'
export const PRIVATE_POSTS_GET_POST_METHOD = 'party.tenna.private.getPost'

export type PrivatePostsModStatus = {
  isBanned: boolean
  reason?: string
}

export type PrivatePost = {
  createdAt?: string
  descriptionFacets?: AppBskyRichtextFacet.Main[]
  error?: string
  text?: string
}

async function getPrivatePostsServiceAuthToken({
  agent,
  appViewDID,
  lxm,
}: {
  agent: AtpAgentType
  appViewDID: string
  lxm: string
}) {
  const audience = appViewDID.split('#', 1)[0]
  const {data} = await pdsAgent(agent).com.atproto.server.getServiceAuth({
    aud: audience,
    lxm,
  })
  return data.token
}

async function callPrivatePostsAppView({
  agent,
  appViewURL,
  appViewDID,
  lxm,
  params,
}: {
  agent: AtpAgentType
  appViewURL: string
  appViewDID: string
  lxm: string
  params?: Record<string, string>
}) {
  const token = await getPrivatePostsServiceAuthToken({agent, appViewDID, lxm})
  const url = new URL(`/xrpc/${lxm}`, appViewURL)
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  })
  const body = (await response.json()) as unknown
  if (!response.ok) {
    const error =
      typeof body === 'object' && body !== null && 'error' in body
        ? String(body.error)
        : `HTTP ${response.status}`
    throw new Error(`Private posts AppView request failed: ${error}`)
  }

  return body
}

export async function getPrivatePostsModStatus({
  agent,
  appViewURL,
  appViewDID,
}: {
  agent: AtpAgentType
  appViewURL: string
  appViewDID: string
}): Promise<PrivatePostsModStatus> {
  const response = await callPrivatePostsAppView({
    agent,
    appViewURL,
    appViewDID,
    lxm: PRIVATE_POSTS_MOD_STATUS_METHOD,
  })
  return response as PrivatePostsModStatus
}

export async function getPrivatePost({
  agent,
  appViewURL,
  appViewDID,
  uri,
  cid,
}: {
  agent: AtpAgentType
  appViewURL: string
  appViewDID: string
  uri: string
  cid: string
}): Promise<PrivatePost> {
  const response = await callPrivatePostsAppView({
    agent,
    appViewURL,
    appViewDID,
    lxm: PRIVATE_POSTS_GET_POST_METHOD,
    params: {uri, cid},
  })
  return response as PrivatePost
}

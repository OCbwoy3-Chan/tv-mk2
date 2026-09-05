import {
  type AppBskyRichtextFacet,
  type AtpAgent as AtpAgentType,
} from '@atproto/api'
import {xrpc} from '@atproto/lex'
import {
  base64url,
  exportJWK,
  generateKeyPair,
  type JWK,
  type KeyLike,
  SignJWT,
} from 'jose'
import {sha256} from 'js-sha256'

import {
  createPrivateRecord,
  getDelegationToken,
  getLatestCommit,
  listSpaces,
  putPrivateRecord,
} from '#/lib/spaces/lexicons'
import {pdsAgent} from '#/state/session/agent'

export const PRIVATE_POSTS_MOD_STATUS_METHOD =
  'party.tenna.private.getModStatus'
export const PRIVATE_POSTS_GET_POST_METHOD = 'party.tenna.private.getPost'
export const PRIVATE_POSTS_GET_STATE_METHOD = 'party.tenna.private.getState'

export type PrivatePostsOffendingContent = {
  name: string
  reason: string
}

export type PrivatePostsModStatus = {
  isBanned: boolean
  reason?: string
  offendingContent?: PrivatePostsOffendingContent[]
}

export type PrivatePostsState = Record<string, unknown>

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

async function createSpaceDpopProof(
  method: string,
  url: URL,
  accessToken: string,
  privateKey: KeyLike,
  publicJwk: JWK,
  includeAth = true,
) {
  const digest = new Uint8Array(sha256.arrayBuffer(accessToken))
  const claims: Record<string, unknown> = {
    htm: method,
    htu: url.toString(),
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  }
  if (includeAth) claims.ath = base64url.encode(digest)
  return new SignJWT(claims)
    .setProtectedHeader({typ: 'dpop+jwt', alg: 'ES256', jwk: publicJwk})
    .sign(privateKey)
}

export async function registerPrivatePostsAppView({
  agent,
  appViewURL,
  appViewDID,
}: {
  agent: AtpAgentType
  appViewURL: string
  appViewDID: string
}) {
  const directAgent = pdsAgent(agent)
  const space = `at://${agent.assertDid}/space/party.tenna.private.space/self`
  const delegation = await xrpc(
    {
      did: directAgent.did,
      fetchHandler: (path, init) =>
        directAgent.sessionManager.fetchHandler(path, init),
    },
    getDelegationToken,
    {
      params: {space},
    },
  )
  const {privateKey, publicKey} = await generateKeyPair('ES256', {
    extractable: true,
  })
  const publicJwk = await exportJWK(publicKey)
  const privateJwk = await exportJWK(privateKey)
  const pdsUrl = directAgent.pdsUrl ?? directAgent.serviceUrl

  const credentialUrl = new URL(
    '/xrpc/com.atproto.space.getSpaceCredential',
    pdsUrl,
  )
  const credentialResponse = await fetch(credentialUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${delegation.body.token}`,
      DPoP: await createSpaceDpopProof(
        'POST',
        credentialUrl,
        delegation.body.token,
        privateKey,
        publicJwk,
        false,
      ),
    },
    body: JSON.stringify({space}),
  })
  if (!credentialResponse.ok) {
    throw new Error(
      `Private posts space credential failed (HTTP ${credentialResponse.status})`,
    )
  }
  const {credential} = (await credentialResponse.json()) as {credential: string}

  const notifyUrl = new URL('/xrpc/com.atproto.space.registerNotify', pdsUrl)
  const notifyResponse = await fetch(notifyUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `DPoP ${credential}`,
      DPoP: await createSpaceDpopProof(
        'POST',
        notifyUrl,
        credential,
        privateKey,
        publicJwk,
      ),
    },
    body: JSON.stringify({space, service: appViewDID}),
  })
  if (!notifyResponse.ok) {
    throw new Error(
      `Private posts notification registration failed (HTTP ${notifyResponse.status})`,
    )
  }

  const appViewAuth = await getPrivatePostsServiceAuthToken({
    agent,
    appViewDID,
    lxm: 'party.tenna.private.registerSpaceCredential',
  })
  const registrationUrl = new URL(
    '/xrpc/party.tenna.private.registerSpaceCredential',
    appViewURL,
  )
  const registrationResponse = await fetch(registrationUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${appViewAuth}`,
    },
    body: JSON.stringify({space, credential, dpopPrivateJwk: privateJwk}),
  })
  if (!registrationResponse.ok) {
    throw new Error(
      `Private posts AppView registration failed (HTTP ${registrationResponse.status})`,
    )
  }
}

export async function forcePrivatePostsResync({
  agent,
  appViewURL,
  appViewDID,
}: {
  agent: AtpAgentType
  appViewURL: string
  appViewDID: string
}) {
  await registerPrivatePostsAppView({agent, appViewURL, appViewDID})
  const directAgent = pdsAgent(agent)
  const space = `at://${agent.assertDid}/space/party.tenna.private.space/self`
  const latest = await xrpc(
    {
      did: directAgent.did,
      fetchHandler: (path, init) =>
        directAgent.sessionManager.fetchHandler(path, init),
    },
    getLatestCommit,
    {params: {space, repo: agent.assertDid}},
  )
  const token = await getPrivatePostsServiceAuthToken({
    agent,
    appViewDID,
    lxm: 'com.atproto.space.notifyWrite',
  })
  const response = await fetch(
    new URL('/xrpc/com.atproto.space.notifyWrite', appViewURL),
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        space,
        repo: agent.assertDid,
        rev: latest.body.commit.rev,
        hash: base64url.encode(latest.body.commit.hash),
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Private posts resync failed (HTTP ${response.status})`)
  }
}

export async function createPrivatePost({
  agent,
  rkey,
  text,
  facets,
  createdAt,
}: {
  agent: AtpAgentType
  rkey: string
  text: string
  facets?: AppBskyRichtextFacet.Main[]
  createdAt?: string
}): Promise<{uri: string; cid: string}> {
  const directAgent = pdsAgent(agent)
  const xrpcAgent = {
    did: directAgent.did,
    fetchHandler: (path: string, init?: RequestInit) =>
      directAgent.sessionManager.fetchHandler(path, init),
  }
  const space = `at://${agent.assertDid}/space/party.tenna.private.space/self`
  const spaces = await xrpc(xrpcAgent, listSpaces, {
    params: {type: 'party.tenna.private.space'},
  })
  const body = {
    space,
    repo: agent.assertDid,
    collection: 'party.tenna.private.post',
    rkey,
    record: {
      $type: 'party.tenna.private.post' as const,
      text,
      createdAt: createdAt ?? new Date().toISOString(),
      ...(facets?.length ? {descriptionFacets: facets} : {}),
    },
  }
  if (spaces.body.spaces.some(spaceView => spaceView.uri === space)) {
    return (
      await xrpc(xrpcAgent, putPrivateRecord, {params: {}, body: body as never})
    ).body
  }
  return (
    await xrpc(xrpcAgent, createPrivateRecord, {
      params: {},
      body: body as never,
    })
  ).body
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

export async function getPrivatePostsState({
  agent,
  appViewURL,
  appViewDID,
}: {
  agent: AtpAgentType
  appViewURL: string
  appViewDID: string
}): Promise<PrivatePostsState> {
  const response = await callPrivatePostsAppView({
    agent,
    appViewURL,
    appViewDID,
    lxm: PRIVATE_POSTS_GET_STATE_METHOD,
  })
  return response as PrivatePostsState
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

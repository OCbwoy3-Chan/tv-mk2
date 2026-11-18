import { type Client } from '@atproto/lex'
import { AtUri } from '@atproto/syntax'

import { KRIS_FEED_GENERATOR_DID, KRIS_FEED_OWNER_DID } from '#/lib/constants'
import { isRecordNotFoundError } from '#/lib/xrpc-error'
import { com } from '#/lexicons'
import * as feedPreference from '#/lexicons/party/tenna/feed/preference'

export function isOfficialKrisFeed(uri: string, generatorDid?: string) {
  const feed = new AtUri(uri)
  return (
    feed.host === KRIS_FEED_OWNER_DID &&
    feed.collection === 'app.bsky.feed.generator' &&
    generatorDid === KRIS_FEED_GENERATOR_DID
  )
}

export async function readPreference(client: Client, uri: string) {
  try {
    return await client.call(com.atproto.repo.getRecord, {
      repo: client.assertDid,
      collection: feedPreference.$nsid,
      rkey: new AtUri(uri).rkeySafe,
    })
  } catch (error) {
    if (isRecordNotFoundError(error)) return null
    throw error
  }
}

export async function writePreference(
  client: Client,
  uri: string,
  patch: Partial<
    Pick<feedPreference.Main, 'optOut' | 'showMarkedPosts'>
  >,
) {
  const current = await readPreference(client, uri)
  const record = feedPreference.$parse({
    ...current?.value,
    $type: feedPreference.$nsid,
    ...patch,
  })
  await client.call(com.atproto.repo.putRecord, {
    repo: client.assertDid,
    collection: feedPreference.$nsid,
    rkey: new AtUri(uri).rkeySafe,
    swapRecord: current?.cid ?? null,
    record,
  })
  return record
}

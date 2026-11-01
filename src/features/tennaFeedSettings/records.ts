import {type Client} from '@atproto/lex'
import {AtUri} from '@atproto/syntax'

import {TENNA_FEED_GENERATOR_DID, TENNA_FEED_OWNER_DID} from '#/lib/constants'
import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {com, party} from '#/lexicons'

export function isOfficialTennaFeed(uri: string, generatorDid?: string) {
  const feed = new AtUri(uri)
  return (
    feed.host === TENNA_FEED_OWNER_DID &&
    feed.collection === 'app.bsky.feed.generator' &&
    generatorDid === TENNA_FEED_GENERATOR_DID
  )
}

export async function readPreference(client: Client, uri: string) {
  try {
    return await client.call(com.atproto.repo.getRecord, {
      repo: client.assertDid,
      collection: party.tenna.feed.preference.$nsid,
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
  patch: Partial<Pick<party.tenna.feed.preference.Main, 'optOut' | 'showMarkedPosts'>>,
) {
  const current = await readPreference(client, uri)
  const record = party.tenna.feed.preference.$parse({
    ...current?.value,
    $type: party.tenna.feed.preference.$nsid,
    ...patch,
  })
  await client.call(com.atproto.repo.putRecord, {
    repo: client.assertDid,
    collection: party.tenna.feed.preference.$nsid,
    rkey: new AtUri(uri).rkeySafe,
    swapRecord: current?.cid ?? null,
    record,
  })
  return record
}

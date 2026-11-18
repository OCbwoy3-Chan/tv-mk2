import {TID} from '@atproto/common-web'
import {type Client} from '@atproto/lex'

import {type PollDraft, pollEndsAt, pollOptionsForPublish} from '#/lib/api/poll'
import {logger} from '#/logger'
import {
  TOKIMEKI_HOSTS,
  TOKIMEKI_POLL_COLLECTION,
} from '#/features/tokimeki/types'

/**
 * The post a poll belongs to, by URI only: the post points back at the poll
 * with a strongRef (`external.associatedRefs`), so it is written after the
 * poll and its CID isn't known yet. TOKIMEKI's lexicon makes the CID optional
 * for exactly this.
 */
export type PollPostRef = {uri: string}

export function tokimekiPollUrl(did: string, rkey: string): string {
  return `https://${TOKIMEKI_HOSTS[0]}/p/${did}/${rkey}`
}

function pollRecord(draft: PollDraft, post: PollPostRef, now: Date) {
  return {
    $type: TOKIMEKI_POLL_COLLECTION,
    subject: {uri: post.uri},
    options: pollOptionsForPublish(draft),
    createdAt: now.toISOString(),
    endsAt: pollEndsAt(draft.duration, now),
  }
}

/**
 * Writes a `tech.tokimeki.poll.poll` record to the author's repo. The record
 * names its post by CID, so the post is hashed before this runs; `putRecord`
 * keeps a retry on the same key rather than leaving duplicate records behind.
 */
export async function createPoll(
  client: Client,
  draft: PollDraft,
  post: PollPostRef,
  now = new Date(),
): Promise<{rkey: string; uri: string; cid: string}> {
  const rkey = draft.rkey ?? TID.nextStr()
  const res = await client.putRecord(
    pollRecord(draft, post, now) as never,
    rkey,
    {repo: client.assertDid, service: null},
  )
  return {rkey, uri: res.body.uri, cid: res.body.cid}
}

/** Removes a poll left behind by a post that never got written. */
export async function deletePoll(client: Client, rkey: string): Promise<void> {
  try {
    await client.deleteRecord(TOKIMEKI_POLL_COLLECTION, rkey, {
      repo: client.assertDid,
      service: null,
    })
  } catch (err) {
    logger.warn('Could not clean up an unsent poll', {safeMessage: err})
  }
}

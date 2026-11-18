import {type DidString} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {getOptionIssue} from '#/lib/api/poll'
import {useDeferredEnable} from '#/lib/hooks/useDeferredEnable'
import {useConstellationInstance} from '#/state/preferences/constellation-instance'
import {STALE} from '#/state/queries'
import {
  asyncGenCollect,
  constellationLinks,
} from '#/state/queries/constellation'
import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {createQueryKey} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {withRecentVote} from './recent-votes'
import {
  TOKIMEKI_HOSTS,
  TOKIMEKI_POLL_COLLECTION,
  TOKIMEKI_VOTE_COLLECTION,
  type TokimekiPoll,
  type TokimekiPollRef,
} from './types'

export const RQKEY_POLL = (uri: string, viewer: string, instance: string) =>
  createQueryKey('tokimekiPoll', {uri, viewer, instance})

async function readRecord(did: string, collection: string, rkey: string) {
  const pds = await resolvePdsServiceUrl(did as DidString)
  if (!pds) return null
  const url = new URL('/xrpc/com.atproto.repo.getRecord', pds)
  url.searchParams.set('repo', did)
  url.searchParams.set('collection', collection)
  url.searchParams.set('rkey', rkey)
  const response = await fetch(url)
  if (response.status === 404) return null
  if (!response.ok)
    throw new Error(`Could not read poll record: ${response.status}`)
  const data = (await response.json()) as {
    uri?: string
    cid?: string
    value?: Record<string, unknown>
  }
  if (
    data.uri !== `at://${did}/${collection}/${rkey}` ||
    typeof data.cid !== 'string' ||
    !data.value ||
    data.value.$type !== collection
  ) {
    return null
  }
  return {uri: data.uri, cid: data.cid, value: data.value}
}

type PollRecordValue = {options: string[]; createdAt: string; endsAt: string}

function isPollValue(value: Record<string, unknown>): value is PollRecordValue {
  const {options, endsAt, createdAt} = value
  return (
    Array.isArray(options) &&
    options.length >= 2 &&
    options.length <= 4 &&
    options.every(o => typeof o === 'string' && getOptionIssue(o) === null) &&
    typeof endsAt === 'string' &&
    Number.isFinite(Date.parse(endsAt)) &&
    typeof createdAt === 'string' &&
    Number.isFinite(Date.parse(createdAt))
  )
}

/**
 * A vote's choice and time, or undefined if it doesn't count. Votes are
 * matched to the poll by URI, not CID: a poll record can have more than one
 * version (Witchsky used to write it twice while publishing), and TOKIMEKI
 * hands voters the CID of the version it indexed first.
 */
function readVote(
  value: Record<string, unknown> | undefined,
  pollUri: string,
  poll: PollRecordValue,
): {index: number; time: number} | undefined {
  if (!value) return
  const ref = value.poll as {uri?: unknown} | undefined
  const index = value.optionIndex
  const time =
    typeof value.createdAt === 'string' ? Date.parse(value.createdAt) : NaN
  if (
    ref?.uri !== pollUri ||
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= poll.options.length ||
    !Number.isFinite(time) ||
    time < Date.parse(poll.createdAt) ||
    time > Date.parse(poll.endsAt)
  ) {
    return
  }
  return {index, time}
}

/**
 * Each voter's verified votes from Constellation's backlinks, one per voter.
 * The first vote counts, as on TOKIMEKI: a second record (a double tap, a
 * race between clients) does not replace it.
 */
async function verifiedVotes(
  instance: string,
  pollUri: string,
  poll: PollRecordValue,
  fromDids?: string[],
) {
  const links = await asyncGenCollect(
    constellationLinks(instance, {
      target: pollUri,
      collection: TOKIMEKI_VOTE_COLLECTION,
      path: '.poll.uri',
      ...(fromDids ? {from_dids: fromDids} : {}),
    }),
  )
  const votes = await Promise.all(
    links.map(async link => ({
      did: link.did,
      record: await readRecord(link.did, TOKIMEKI_VOTE_COLLECTION, link.rkey),
    })),
  )
  const byVoter = new Map<string, {index: number; time: number}>()
  for (const vote of votes) {
    const counted = readVote(vote.record?.value, pollUri, poll)
    if (!counted) continue
    const previous = byVoter.get(vote.did)
    if (!previous || counted.time < previous.time) {
      byVoter.set(vote.did, counted)
    }
  }
  return byVoter
}

type ServicePoll = {
  poll?: {
    uri?: unknown
    cid?: unknown
    options?: unknown
    createdAt?: unknown
    endsAt?: unknown
  }
  options?: {index?: unknown; count?: unknown}[]
  totalVotes?: unknown
}

/**
 * The poll and its counts from TOKIMEKI's own AppView. Throws when it can't
 * be used (unreachable, not indexed yet, or an unexpected shape), so the
 * caller falls back to counting from Constellation.
 */
async function fetchFromTokimeki(pollUri: string) {
  const url = new URL(
    `https://${TOKIMEKI_HOSTS[0]}/xrpc/tech.tokimeki.poll.getPoll`,
  )
  url.searchParams.set('uri', pollUri)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`getPoll failed: ${response.status}`)
  const body = (await response.json()) as ServicePoll
  const poll = body.poll
  const value = {
    options: poll?.options,
    createdAt: poll?.createdAt,
    endsAt: poll?.endsAt,
  }
  if (
    !poll ||
    poll.uri !== pollUri ||
    typeof poll.cid !== 'string' ||
    !isPollValue(value) ||
    !Array.isArray(body.options) ||
    typeof body.totalVotes !== 'number'
  ) {
    throw new Error('Unexpected getPoll response')
  }
  const counts = value.options.map(() => 0)
  for (const option of body.options) {
    const {index, count} = option
    if (
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= counts.length ||
      typeof count !== 'number' ||
      !Number.isInteger(count) ||
      count < 0
    ) {
      throw new Error('Unexpected getPoll counts')
    }
    counts[index] = count
  }
  return {
    uri: pollUri,
    cid: poll.cid,
    value,
    counts,
    totalVotes: body.totalVotes,
  }
}

/**
 * The poll with its counts. TOKIMEKI's AppView is asked first; it is what
 * TOKIMEKI itself shows, and its CID is the one voters there vote against. The
 * viewer's own vote still comes from their repo, since an unauthenticated
 * request can't tell who is asking. If TOKIMEKI can't answer, the poll is read
 * from its PDS and the votes are counted from Constellation's backlinks.
 */
export async function fetchTokimekiPoll(
  ref: TokimekiPollRef,
  viewerDid: string,
  instance: string,
): Promise<TokimekiPoll | null> {
  const pollUri = `at://${ref.did}/${TOKIMEKI_POLL_COLLECTION}/${ref.rkey}`
  try {
    const fromService = await fetchFromTokimeki(pollUri)
    let myVote: number | undefined
    if (viewerDid) {
      try {
        const mine = await verifiedVotes(instance, pollUri, fromService.value, [
          viewerDid,
        ])
        myVote = mine.get(viewerDid)?.index
      } catch {
        /* The counts are still right without it. */
      }
    }
    return {
      uri: fromService.uri,
      cid: fromService.cid,
      options: fromService.value.options,
      endsAt: fromService.value.endsAt,
      counts: fromService.counts,
      totalVotes: fromService.totalVotes,
      myVote,
    }
  } catch {
    return fetchFromConstellation(ref, viewerDid, instance)
  }
}

/** Read the poll from its PDS and verify Constellation's vote backlinks there. */
async function fetchFromConstellation(
  ref: TokimekiPollRef,
  viewerDid: string,
  instance: string,
): Promise<TokimekiPoll | null> {
  const record = await readRecord(ref.did, TOKIMEKI_POLL_COLLECTION, ref.rkey)
  if (!record || !isPollValue(record.value)) return null
  const value = record.value
  const byVoter = await verifiedVotes(instance, record.uri, value)
  const counts = value.options.map(() => 0)
  for (const vote of byVoter.values()) counts[vote.index]++
  return {
    uri: record.uri,
    cid: record.cid,
    options: value.options,
    endsAt: value.endsAt,
    counts,
    totalVotes: byVoter.size,
    myVote: byVoter.get(viewerDid)?.index,
  }
}

export function useTokimekiPoll({
  ref,
  enabled,
}: {
  ref: TokimekiPollRef | undefined
  enabled: boolean
}) {
  const {currentAccount} = useSession()
  const instance = useConstellationInstance()
  const viewerDid = currentAccount?.did ?? ''
  const deferred = useDeferredEnable(enabled && Boolean(ref))

  return useQuery({
    queryKey: RQKEY_POLL(
      ref ? `at://${ref.did}/${TOKIMEKI_POLL_COLLECTION}/${ref.rkey}` : '',
      viewerDid,
      instance,
    ),
    enabled: deferred,
    staleTime: STALE.SECONDS.THIRTY,
    async queryFn() {
      if (!ref) return null
      return withRecentVote(
        await fetchTokimekiPoll(ref, viewerDid, instance),
        viewerDid,
      )
    },
  })
}

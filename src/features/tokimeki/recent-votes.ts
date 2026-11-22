import {type TokimekiPoll} from './types'

/** How long a change made here is trusted over indexers that haven't seen it. */
const RECENT_VOTE_TTL_MS = 10 * 60 * 1000

type RecentVote = {
  /** A vote cast here, or one taken back. */
  kind: 'vote' | 'unvote'
  index: number
  /** The option's count when the change was made. */
  baseCount: number
  at: number
  /** The vote record written, once the write has landed. */
  uri?: string
}

/*
 * Votes this client just cast or took back, by poll and voter. TOKIMEKI's
 * counts and the voter's own vote (found via Constellation) both lag the
 * write, so a refetch soon after can come back without the change.
 */
const recentVotes = new Map<string, RecentVote>()
const keyOf = (pollUri: string, viewerDid: string) => `${pollUri} ${viewerDid}`

export function rememberVote(
  poll: TokimekiPoll,
  viewerDid: string,
  index: number,
  now = Date.now(),
) {
  recentVotes.set(keyOf(poll.uri, viewerDid), {
    kind: 'vote',
    index,
    baseCount: poll.counts[index] ?? 0,
    at: now,
  })
}

/** `poll` is as it was with the vote still counted. */
export function rememberUnvote(
  poll: TokimekiPoll,
  viewerDid: string,
  index: number,
  now = Date.now(),
) {
  recentVotes.set(keyOf(poll.uri, viewerDid), {
    kind: 'unvote',
    index,
    baseCount: poll.counts[index] ?? 0,
    at: now,
  })
}

/** Attach the written vote record to the vote just remembered. */
export function noteVoteRecord(
  pollUri: string,
  viewerDid: string,
  uri: string,
) {
  const change = recentVotes.get(keyOf(pollUri, viewerDid))
  if (change?.kind === 'vote') change.uri = uri
}

export function forgetVote(pollUri: string, viewerDid: string) {
  recentVotes.delete(keyOf(pollUri, viewerDid))
}

/**
 * Lay a change made here over freshly fetched data that doesn't show it yet:
 * the count until TOKIMEKI's reflects it, and the viewer's choice until their
 * own records do. Forgotten once both catch up, or after a while.
 */
export function withRecentVote(
  poll: TokimekiPoll | null,
  viewerDid: string,
  now = Date.now(),
): TokimekiPoll | null {
  if (!poll || !viewerDid) return poll
  const key = keyOf(poll.uri, viewerDid)
  const change = recentVotes.get(key)
  if (!change) return poll
  if (now - change.at > RECENT_VOTE_TTL_MS) {
    recentVotes.delete(key)
    return poll
  }
  const count = poll.counts[change.index] ?? 0
  if (change.kind === 'vote') {
    const counted = count > change.baseCount
    const known = poll.myVote !== undefined
    if (counted && known) {
      recentVotes.delete(key)
      return poll
    }
    return {
      ...poll,
      counts: counted
        ? poll.counts
        : poll.counts.map((c, i) => (i === change.index ? c + 1 : c)),
      totalVotes: counted ? poll.totalVotes : poll.totalVotes + 1,
      myVote: poll.myVote ?? change.index,
      myVoteUris: poll.myVoteUris ?? (change.uri ? [change.uri] : undefined),
    }
  }
  const dropped = count < change.baseCount
  const gone = poll.myVote === undefined && !poll.myVoteUris?.length
  if (dropped && gone) {
    recentVotes.delete(key)
    return poll
  }
  return {
    ...poll,
    counts: dropped
      ? poll.counts
      : poll.counts.map((c, i) =>
          i === change.index ? Math.max(0, c - 1) : c,
        ),
    totalVotes: dropped ? poll.totalVotes : Math.max(0, poll.totalVotes - 1),
    myVote: undefined,
    myVoteUris: undefined,
  }
}

import {type TokimekiPoll} from './types'

/** How long a vote cast here is trusted over indexers that haven't seen it. */
const RECENT_VOTE_TTL_MS = 10 * 60 * 1000

type RecentVote = {
  index: number
  /** The chosen option's count when the vote was cast. */
  baseCount: number
  at: number
}

/*
 * Votes this client just cast, by poll and voter. TOKIMEKI's counts and the
 * voter's own vote (found via Constellation) both lag the write, so a refetch
 * soon after voting can come back without it.
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
    index,
    baseCount: poll.counts[index] ?? 0,
    at: now,
  })
}

export function forgetVote(pollUri: string, viewerDid: string) {
  recentVotes.delete(keyOf(pollUri, viewerDid))
}

/**
 * Lay a vote cast here over freshly fetched data that doesn't show it yet:
 * the count until TOKIMEKI's includes it, and the viewer's choice until their
 * vote can be found. Forgotten once both catch up, or after a while.
 */
export function withRecentVote(
  poll: TokimekiPoll | null,
  viewerDid: string,
  now = Date.now(),
): TokimekiPoll | null {
  if (!poll || !viewerDid) return poll
  const key = keyOf(poll.uri, viewerDid)
  const vote = recentVotes.get(key)
  if (!vote) return poll
  if (now - vote.at > RECENT_VOTE_TTL_MS) {
    recentVotes.delete(key)
    return poll
  }
  const counted = (poll.counts[vote.index] ?? 0) > vote.baseCount
  const known = poll.myVote !== undefined
  if (counted && known) {
    recentVotes.delete(key)
    return poll
  }
  return {
    ...poll,
    counts: counted
      ? poll.counts
      : poll.counts.map((count, i) => (i === vote.index ? count + 1 : count)),
    totalVotes: counted ? poll.totalVotes : poll.totalVotes + 1,
    myVote: poll.myVote ?? vote.index,
  }
}

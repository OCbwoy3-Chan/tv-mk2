import {
  forgetVote,
  noteVoteRecord,
  rememberUnvote,
  rememberVote,
  withRecentVote,
} from './recent-votes'
import {type TokimekiPoll} from './types'

const viewer = 'did:plc:viewer'
const base: TokimekiPoll = {
  uri: 'at://did:plc:author/tech.tokimeki.poll.poll/1',
  cid: 'cid',
  options: ['Yes', 'No'],
  counts: [2, 3],
  totalVotes: 5,
}

beforeEach(() => forgetVote(base.uri, viewer))

it('keeps a fresh vote while neither source has caught up', () => {
  rememberVote(base, viewer, 1, 0)
  expect(withRecentVote(base, viewer, 1000)).toMatchObject({
    counts: [2, 4],
    totalVotes: 6,
    myVote: 1,
  })
})

it('does not double count once TOKIMEKI has the vote', () => {
  rememberVote(base, viewer, 1, 0)
  const counted = {...base, counts: [2, 4], totalVotes: 6}
  expect(withRecentVote(counted, viewer, 1000)).toMatchObject({
    counts: [2, 4],
    totalVotes: 6,
    myVote: 1,
  })
})

it('steps aside once both have caught up', () => {
  rememberVote(base, viewer, 1, 0)
  const caughtUp = {...base, counts: [2, 4], totalVotes: 6, myVote: 1}
  expect(withRecentVote(caughtUp, viewer, 1000)).toBe(caughtUp)
  // Forgotten: later data is taken as is.
  expect(withRecentVote(base, viewer, 2000)).toBe(base)
})

it('expires, and never applies to other viewers', () => {
  rememberVote(base, viewer, 0, 0)
  expect(withRecentVote(base, 'did:plc:other', 1000)).toBe(base)
  expect(withRecentVote(base, viewer, 11 * 60 * 1000)).toBe(base)
})

describe('taking a vote back', () => {
  const voted = {
    ...base,
    counts: [2, 4],
    totalVotes: 6,
    myVote: 1,
    myVoteUris: ['at://v'],
  }

  it('hides the vote while the indexers still count it', () => {
    rememberUnvote(voted, viewer, 1, 0)
    expect(withRecentVote(voted, viewer, 1000)).toMatchObject({
      counts: [2, 3],
      totalVotes: 5,
      myVote: undefined,
      myVoteUris: undefined,
    })
  })

  it('steps aside once the vote is gone everywhere', () => {
    rememberUnvote(voted, viewer, 1, 0)
    expect(withRecentVote(base, viewer, 1000)).toBe(base)
    expect(withRecentVote(voted, viewer, 2000)).toBe(voted)
  })
})

it('keeps the new vote record so it can be removed right away', () => {
  rememberVote(base, viewer, 0, 0)
  noteVoteRecord(
    base.uri,
    viewer,
    'at://did:plc:viewer/tech.tokimeki.poll.vote/1',
  )
  expect(withRecentVote(base, viewer, 1000)?.myVoteUris).toEqual([
    'at://did:plc:viewer/tech.tokimeki.poll.vote/1',
  ])
})

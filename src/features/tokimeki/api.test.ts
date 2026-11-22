import {constellationLinks} from '#/state/queries/constellation'
import {fetchTokimekiPoll} from './api'
import {TOKIMEKI_POLL_COLLECTION, TOKIMEKI_VOTE_COLLECTION} from './types'

jest.mock('#/state/queries/resolve-identity', () => ({
  resolvePdsServiceUrl: jest.fn(() => Promise.resolve('https://pds.test')),
}))
jest.mock('#/state/queries/constellation', () => ({
  ...jest.requireActual('#/state/queries/constellation'),
  constellationLinks: jest.fn(),
}))
jest.mock('#/state/session', () => ({useSession: jest.fn()}))

const author = 'did:web:author.test'
const voter = 'did:plc:voter'
const ref = {did: author, rkey: 'poll'}
const uri = `at://${author}/${TOKIMEKI_POLL_COLLECTION}/poll`
const originalFetch = global.fetch
const mockFetch: jest.MockedFunction<typeof fetch> = jest.fn()
const records = new Map<string, object>()
/** What TOKIMEKI's getPoll returns; undefined answers 404 (not indexed). */
let service: object | undefined

function vote(index: number, createdAt = '2026-11-09T01:00:00Z') {
  return {
    $type: TOKIMEKI_VOTE_COLLECTION,
    poll: {uri, cid: 'poll-cid'},
    optionIndex: index,
    createdAt,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  records.clear()
  service = undefined
  records.set(`${author}/poll`, {
    $type: TOKIMEKI_POLL_COLLECTION,
    options: ['Yes', 'No'],
    createdAt: '2026-11-09T00:00:00Z',
    endsAt: '2026-11-10T00:00:00Z',
  })
  jest
    .mocked(constellationLinks)
    .mockImplementation(async function* (_instance, params) {
      for (const key of records.keys()) {
        const [did, rkey] = key.split('/')
        if (params.from_dids && !params.from_dids.includes(did)) continue
        if (did !== author)
          yield await Promise.resolve({
            did: did as `did:${string}:${string}`,
            collection: TOKIMEKI_VOTE_COLLECTION,
            rkey,
          })
      }
    })
  global.fetch = mockFetch
  mockFetch.mockImplementation(input => {
    if (!(input instanceof URL)) throw new Error('Expected URL')
    const url = input
    if (url.hostname === 'poll.tokimeki.tech') {
      return Promise.resolve({
        ok: Boolean(service),
        status: service ? 200 : 404,
        json: () => Promise.resolve(service),
      } as Response)
    }
    const did = url.searchParams.get('repo')!
    const rkey = url.searchParams.get('rkey')!
    const value = records.get(`${did}/${rkey}`)
    return Promise.resolve({
      ok: Boolean(value),
      status: value ? 200 : 404,
      json: () =>
        Promise.resolve({
          uri: `at://${did}/${url.searchParams.get('collection')}/${rkey}`,
          cid: did === author ? 'poll-cid' : 'vote-cid',
          value,
        }),
    } as Response)
  })
})

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

it('reads a poll directly and counts verified vote backlinks', async () => {
  records.set(`${voter}/vote`, vote(1))
  const poll = await fetchTokimekiPoll(ref, voter, 'https://constellation.test')
  expect(poll).toMatchObject({uri, counts: [0, 1], totalVotes: 1, myVote: 1})
  expect(constellationLinks).toHaveBeenCalledWith(
    'https://constellation.test',
    {
      target: uri,
      collection: TOKIMEKI_VOTE_COLLECTION,
      path: '.poll.uri',
    },
  )
  // TOKIMEKI is asked first; with no answer, everything comes from the PDS.
  const origins = jest
    .mocked(fetch)
    .mock.calls.map(([url]) => (url instanceof URL ? url.origin : ''))
  expect(origins[0]).toBe('https://poll.tokimeki.tech')
  expect(origins.slice(1).every(o => o === 'https://pds.test')).toBe(true)
})

function servicePoll(counts: number[]) {
  return {
    poll: {
      uri,
      cid: 'tokimeki-cid',
      options: ['Yes', 'No'],
      createdAt: '2026-11-09T00:00:00Z',
      endsAt: '2026-11-10T00:00:00Z',
    },
    options: counts.map((count, index) => ({index, count})),
    totalVotes: counts.reduce((sum, n) => sum + n, 0),
    isEnded: false,
  }
}

it("uses TOKIMEKI's counts and CID, and finds the viewer's own vote", async () => {
  service = servicePoll([3, 4])
  records.set(`${voter}/vote`, vote(1))
  records.set('did:plc:other/vote', vote(0))

  const poll = await fetchTokimekiPoll(ref, voter, 'https://constellation.test')

  expect(poll).toEqual({
    uri,
    cid: 'tokimeki-cid',
    options: ['Yes', 'No'],
    endsAt: '2026-11-10T00:00:00Z',
    counts: [3, 4],
    totalVotes: 7,
    myVote: 1,
    myVoteUris: [`at://${voter}/${TOKIMEKI_VOTE_COLLECTION}/vote`],
  })
  // Only the viewer's own backlinks are looked up.
  expect(constellationLinks).toHaveBeenCalledTimes(1)
  expect(jest.mocked(constellationLinks).mock.calls[0][1]).toMatchObject({
    from_dids: [voter],
  })
})

it('asks nothing more when signed out and TOKIMEKI answers', async () => {
  service = servicePoll([1, 1])
  expect(
    await fetchTokimekiPoll(ref, '', 'https://constellation.test'),
  ).toMatchObject({counts: [1, 1], totalVotes: 2, myVote: undefined})
  expect(constellationLinks).not.toHaveBeenCalled()
})

it('falls back to Constellation when TOKIMEKI answers unexpectedly', async () => {
  service = {...servicePoll([5, 5]), totalVotes: 'lots'}
  records.set(`${voter}/vote`, vote(0))
  expect(
    await fetchTokimekiPoll(ref, voter, 'https://constellation.test'),
  ).toMatchObject({cid: 'poll-cid', counts: [1, 0], totalVotes: 1, myVote: 0})
})

it('counts each voter once using their first valid vote, as TOKIMEKI does', async () => {
  records.set(`${voter}/old`, vote(0))
  records.set(`${voter}/new`, vote(1, '2026-11-09T02:00:00Z'))
  expect(
    await fetchTokimekiPoll(ref, voter, 'https://constellation.test'),
  ).toMatchObject({counts: [1, 0], totalVotes: 1, myVote: 0})
})

it('counts a vote cast against an earlier version of the poll', async () => {
  records.set(`${voter}/vote`, {...vote(1), poll: {uri, cid: 'first-cid'}})
  expect(
    await fetchTokimekiPoll(ref, voter, 'https://constellation.test'),
  ).toMatchObject({counts: [0, 1], totalVotes: 1, myVote: 1})
})

it('rejects other polls, invalid choices and votes after closing', async () => {
  records.set('did:plc:wronguri/vote', {
    ...vote(0),
    poll: {uri: 'at://another/poll/key', cid: 'poll-cid'},
  })
  records.set('did:plc:fraction/vote', vote(0.5))
  records.set('did:plc:outside/vote', vote(2))
  records.set('did:plc:late/vote', vote(0, '2026-11-11T00:00:00Z'))
  expect(
    await fetchTokimekiPoll(ref, voter, 'https://constellation.test'),
  ).toMatchObject({counts: [0, 0], totalVotes: 0, myVote: undefined})
})

it('still displays a new poll with no indexed votes', async () => {
  expect(
    await fetchTokimekiPoll(ref, '', 'https://constellation.test'),
  ).toMatchObject({options: ['Yes', 'No'], counts: [0, 0], totalVotes: 0})
})

it('does not treat an unreadable PDS as a missing poll', async () => {
  // TOKIMEKI has no answer either, so the fallback's PDS read is what fails.
  const answer = mockFetch.getMockImplementation()!
  mockFetch.mockImplementation((input, init) =>
    input instanceof URL && input.origin === 'https://pds.test'
      ? Promise.resolve({ok: false, status: 503} as Response)
      : answer(input, init),
  )
  await expect(
    fetchTokimekiPoll(ref, '', 'https://constellation.test'),
  ).rejects.toThrow('Could not read poll record: 503')
})

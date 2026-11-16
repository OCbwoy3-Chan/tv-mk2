import {createElement} from 'react'
import {Client} from '@atproto/lex'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'

import {
  fetchReactionCounts,
  mergeViewerReactions,
  parseGroup,
  useReactionGroups,
} from '#/features/bluemoji/reactions/queries'
import {getReactionEmojiImage} from '#/features/bluemoji/reactions/util'

jest.unmock('multiformats/cid')

/*
 * The file is `.ts` for the payload parsers, so the hook test at the bottom
 * builds its wrapper with `createElement` rather than JSX.
 */

jest.mock('#/state/queries', () => ({
  STALE: {MINUTES: {ONE: 60000, FIVE: 300000}},
}))
jest.mock('#/state/queries/util', () => ({
  createQueryKey: (root: string, args: unknown) => [root, args],
}))
jest.mock('#/lib/hooks/useDeferredEnable', () => ({
  useDeferredEnable: (enabled: boolean) => enabled,
}))
/*
 * Signed in by default: the bug this file guards only reproduced for a viewer
 * whose own reaction list had loaded, which logged-out renders never reach.
 */
const mockSession = {currentAccount: undefined as {did: string} | undefined}
jest.mock('#/state/session', () => ({
  usePdsClient: () => ({call: jest.fn().mockResolvedValue({records: []})}),
  useSession: () => mockSession,
}))
jest.mock('#/state/preferences/constellation-instance', () => ({
  useConstellationInstance: () => undefined,
}))
jest.mock('#/features/bluemoji/reactions/constellation', () => ({
  useConstellationReactionsQuery: () => ({data: undefined}),
}))

const INSTANCE = 'https://moji.example'

const call = jest.spyOn(Client.prototype, 'call')

const emoji = {
  $type: 'blue.moji.feed.reaction#emojiRef',
  uri: 'at://did:plc:owner/blue.moji.collection.item/blobcat',
  name: ':blobcat:',
  formats: {$type: 'blue.moji.richtext.facet#formats_v1'},
}

const counts = (uri: string, count: number) => ({
  uri,
  groups: [
    {
      $type: 'blue.moji.feed.defs#reactionGroup',
      emoji,
      count,
    },
  ],
})

beforeEach(() => call.mockReset())
afterAll(() => call.mockRestore())

it('coalesces concurrent lookups into one request and resolves each subject', async () => {
  call.mockImplementation((_def, params: {uris: string[]}) =>
    Promise.resolve({
      counts: params.uris.map((uri, i) => counts(uri, i + 1)),
    }),
  )

  const [a, b, c] = await Promise.all([
    fetchReactionCounts(INSTANCE, 'at://post/a'),
    fetchReactionCounts(INSTANCE, 'at://post/b'),
    fetchReactionCounts(INSTANCE, 'at://post/c'),
  ])

  expect(call).toHaveBeenCalledTimes(1)
  expect(call.mock.calls[0][1]).toMatchObject({
    uris: ['at://post/a', 'at://post/b', 'at://post/c'],
  })
  expect(a?.[0].count).toBe(1)
  expect(b?.[0].count).toBe(2)
  expect(c?.[0].count).toBe(3)
})

it('treats a failed batch as no reactions rather than hanging', async () => {
  call.mockRejectedValue(new Error('offline'))

  await expect(fetchReactionCounts(INSTANCE, 'at://post/a')).resolves.toEqual(
    [],
  )
})

it('drops groups with a zero count', async () => {
  call.mockResolvedValue({counts: [counts('at://post/a', 0)]})

  await expect(fetchReactionCounts(INSTANCE, 'at://post/a')).resolves.toEqual(
    [],
  )
})

/*
 * Captured from moji.blue: the AppView returns `formats` as blob objects, not
 * the CID strings the inline-facet lexicon declares. Validating strictly drops
 * every group, which is what made reactions invisible.
 */
describe('parsing AppView groups', () => {
  const real = {
    $type: 'blue.moji.feed.defs#reactionGroup',
    emoji: {
      $type: 'blue.moji.feed.reaction#emojiRef',
      uri: 'at://did:plc:kmzpsik7s5y5fwu7nnkngfx4/blue.moji.collection.item/party_heart',
      cid: 'bafyreia3ayj46qnsgiqvothtc7y5bgzoyi4crgjsp5324vls5tm5wdmtmi',
      name: ':party_heart:',
      alt: 'party heart',
      adultOnly: false,
      formats: {
        $type: 'blue.moji.collection.item#formats_v1',
        png_128: {
          ref: {
            $link:
              'bafkreif3gkhyfbgywf4woydjd7zn4i53lbvv573rdjim3tuv2mjibblz3q',
          },
          size: 3153,
          $type: 'blob',
          mimeType: 'image/png',
        },
      },
    },
    count: 2,
  }

  it('keeps blob-shaped formats instead of discarding the group', () => {
    const [group] = parseGroup(real)
    expect(group?.count).toBe(2)
    expect(group ? getReactionEmojiImage(group.emoji) : undefined).toBe(
      'https://moji.blue/img/did%3Aplc%3Akmzpsik7s5y5fwu7nnkngfx4/bafkreif3gkhyfbgywf4woydjd7zn4i53lbvv573rdjim3tuv2mjibblz3q',
    )
  })

  it('drops groups with no usable emoji', () => {
    expect(parseGroup({...real, emoji: undefined})).toEqual([])
    expect(parseGroup({...real, count: 0})).toEqual([])
    expect(
      parseGroup({
        ...real,
        emoji: {...real.emoji, uri: 'https://example.com/x'},
      }),
    ).toEqual([])
  })
})

describe('merging the viewer own reactions', () => {
  const emoji = {
    $type: 'blue.moji.feed.reaction#emojiRef',
    uri: 'at://did:plc:owner/blue.moji.collection.item/blobcat',
    name: ':blobcat:',
  }

  it('adds a viewer reaction the AppView has not indexed yet', () => {
    const groups = mergeViewerReactions(
      [],
      [{uri: 'optimistic', subject: 'at://post', emoji: emoji as never}],
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].emoji.uri).toBe(emoji.uri)
    expect(groups[0].count).toBe(1)
  })

  it('does not double count one the AppView already reports', () => {
    const groups = mergeViewerReactions(
      [{emoji: emoji as never, count: 2}],
      [{uri: 'optimistic', subject: 'at://post', emoji: emoji as never}],
    )
    expect(groups).toEqual([{emoji, count: 2}])
  })

  it('keeps a count of one that belongs to someone else', () => {
    /*
     * moji.blue counts reactions straight from its index and never fills
     * `group.viewer` for our unauthenticated requests, so a single-reactor
     * group cannot be attributed to the viewer. It must survive a viewer whose
     * own list is loaded and empty, or every signed-in user loses everyone
     * else's lone reactions (the bug this guards).
     */
    const groups = mergeViewerReactions([{emoji: emoji as never, count: 1}], [])
    expect(groups).toHaveLength(1)
  })

  it('keeps every group while the viewer own list is still loading', () => {
    const groups = mergeViewerReactions(
      [{emoji: emoji as never, count: 1}],
      undefined,
    )
    expect(groups).toHaveLength(1)
  })

  it('keeps single-reactor groups while the viewer own list is loaded', () => {
    /*
     * Real payload for at://did:plc:63n3qfrrg3zxsngl5ueiae22/app.bsky.feed.post/3n26nuwx6qd2k.
     * Both groups have exactly one reactor and neither is the viewer. An
     * earlier merge dropped every count-1 group whose emoji was missing from
     * the viewer's own list, so a signed-in viewer saw nothing here while a
     * logged-out one saw both.
     */
    const groups = [
      {
        emoji: {
          $type: 'blue.moji.feed.reaction#emojiRef',
          uri: 'at://did:plc:rjhjcb3rgdsmdr6ykywuh63z/blue.moji.collection.item/sweeney',
          cid: 'bafyreihbgf4qlthbpwl3h3c2lzw6dsvm63lhk73rwdo46a7b7s73yu2hgq',
          name: ':sweeney:',
          adultOnly: false,
          formats: {
            $type: 'blue.moji.collection.item#formats_v1',
            png_128: {
              ref: {
                $link:
                  'bafkreifebybbowl6lrcn5plvu2j5ycmhkmk522qpz2gts5yw56nufhfawa',
              },
              size: 30893,
              $type: 'blob',
              mimeType: 'image/png',
            },
          },
        },
        count: 1,
      },
      {
        emoji: {
          $type: 'blue.moji.feed.reaction#emojiRef',
          uri: 'at://did:plc:sil5xxljlas23o3cfkfiis7x/blue.moji.collection.item/nkocatgasp',
          cid: 'bafyreig2o5ipetzbvdr3omkj2lqopkqvwqpbey2j3od7jo4soojqa6fwbm',
          name: ':nkocatgasp:',
          adultOnly: false,
          formats: {
            $type: 'blue.moji.collection.item#formats_v1',
            png_128: {
              ref: {
                $link:
                  'bafkreid2mbhvdgs4elw7phbj642keaa5j4obo3hddky254qbsbjmbwfaye',
              },
              size: 30893,
              $type: 'blob',
              mimeType: 'image/png',
            },
          },
        },
        count: 1,
      },
    ] as never

    // The signed-in path: the viewer's own list loaded and holds nothing here.
    const merged = mergeViewerReactions(groups, [])
    expect(merged.map(group => group.emoji.name)).toEqual([
      ':sweeney:',
      ':nkocatgasp:',
    ])
  })

  it('sorts the largest group first', () => {
    const other = {
      ...emoji,
      uri: 'at://did:plc:owner/blue.moji.collection.item/other',
    }
    const groups = mergeViewerReactions(
      [
        {emoji: emoji as never, count: 1},
        {emoji: other as never, count: 4},
      ],
      [],
    )
    expect(groups.map(group => group.count)).toEqual([4, 1])
  })
})

describe('rendering groups for a signed-in viewer', () => {
  const post = 'at://did:plc:63n3qfrrg3zxsngl5ueiae22/app.bsky.feed.post/3n26nuwx6qd2k'
  const real = {
    $type: 'blue.moji.feed.defs#reactionGroup',
    emoji: {
      $type: 'blue.moji.feed.reaction#emojiRef',
      uri: 'at://did:plc:sil5xxljlas23o3cfkfiis7x/blue.moji.collection.item/nkocatgasp',
      cid: 'bafyreig2o5ipetzbvdr3omkj2lqopkqvwqpbey2j3od7jo4soojqa6fwbm',
      name: ':nkocatgasp:',
      adultOnly: false,
      formats: {
        $type: 'blue.moji.collection.item#formats_v1',
        png_128: {
          ref: {
            $link: 'bafkreid2mbhvdgs4elw7phbj642keaa5j4obo3hddky254qbsbjmbwfaye',
          },
          size: 30893,
          $type: 'blob',
          mimeType: 'image/png',
        },
      },
    },
    count: 1,
  }

  it('keeps another reactor single-reaction group when the viewer has none', async () => {
    /*
     * The reported bug, at the seam both readers share. A signed-in viewer
     * whose own list has loaded and is empty used to lose every count-1 group,
     * because the merge treated "not mine" as "mine, removed". Logged out the
     * same post rendered fine, which is what gave it away.
     */
    mockSession.currentAccount = {did: 'did:plc:me'}
    call.mockImplementation(() => Promise.resolve({counts: [{uri: post, groups: [real]}]}))

    const queryClient = new QueryClient()
    const {result} = renderHook(() => useReactionGroups(post), {
      wrapper: ({children}: {children: React.ReactNode}) =>
        createElement(QueryClientProvider, {client: queryClient}, children),
    })

    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0].count).toBe(1)
    expect(result.current[0].emoji.name).toBe(':nkocatgasp:')
  })
})

import {QueryClient} from '@tanstack/react-query'

import {type FeedPageUnselected} from '#/state/queries/post-feed'
import {type app} from '#/lexicons'
import {
  completeRedraftedPost,
  replacePostInData,
  replaceRedraftedPost,
} from './replace-redrafted-post'

const original = {
  uri: 'at://did:plc:alice/app.bsky.feed.post/old',
  author: {did: 'did:plc:alice', handle: 'alice.test'},
  cid: 'bafyreia',
  indexedAt: '2026-09-09T00:00:00Z',
  record: {text: 'Original'},
} as app.bsky.feed.defs.PostView
const replacement = {
  ...original,
  uri: 'at://did:plc:alice/app.bsky.feed.post/new',
  record: {text: 'Edited'},
} as app.bsky.feed.defs.PostView

it('replaces a feed slot while retaining order, cursor, and unrelated references', () => {
  const other = {...original, uri: 'at://did:plc:bob/app.bsky.feed.post/other'}
  const data = {
    pages: [{feed: [{post: other}, {post: original}], cursor: 'next'}],
    pageParams: [undefined],
  }
  const result = replacePostInData(
    data,
    original.uri,
    replacement,
  ) as typeof data
  expect(result.pages[0].feed[0]).toBe(data.pages[0].feed[0])
  expect(result.pages[0].feed[1].post).toBe(replacement)
  expect(result.pages[0].cursor).toBe('next')
  expect(result.pageParams).toBe(data.pageParams)
  expect(data.pages[0].feed[1].post).toBe(original)
})

it('updates the thread item URI alongside its post', () => {
  const data = {thread: [{uri: original.uri, value: {post: original}}]}
  expect(replacePostInData(data, original.uri, replacement)).toEqual({
    thread: [{uri: replacement.uri, value: {post: replacement}}],
  })
})

it('preserves immutable quote embeds and record references', () => {
  const data = {embed: {post: original}, record: {reply: original}}
  expect(replacePostInData(data, original.uri, replacement)).toBe(data)
})

function setupFeed(feeds: app.bsky.feed.defs.FeedViewPost[][]) {
  const client = new QueryClient()
  const key = ['post-feed', 'following', {}]
  const data = {
    pages: feeds.map((feed, index) => ({
      feed,
      cursor: `cursor-${index}`,
      fetchedAt: index,
      page: index + 1,
    })) as FeedPageUnselected[],
    pageParams: [undefined, {cursor: 'cursor-0'}],
  }
  client.setQueryData(key, data)
  replaceRedraftedPost(client, original.uri, replacement)
  return {data, result: client.getQueryData<typeof data>(key)!}
}

it('replaces a redrafted post at the top of the feed and removes older copies', () => {
  const {data, result} = setupFeed([[{post: original}], [{post: original}]])
  expect(result.pages[0].feed).toEqual([{post: replacement}])
  expect(result.pages[1].feed).toEqual([])
  expect(result.pages[1].cursor).toBe(data.pages[1].cursor)
  expect(result.pageParams).toBe(data.pageParams)
  expect(data.pages[0].feed[0].post).toBe(original)
})

it('removes a redrafted post when there are posts above it on a previous page', () => {
  const other: app.bsky.feed.defs.PostView = {
    ...original,
    uri: 'at://did:plc:bob/app.bsky.feed.post/other',
  }
  const {data, result} = setupFeed([
    [{post: other}],
    [{post: original}, {post: other}],
  ])
  expect(result.pages[0]).toBe(data.pages[0])
  expect(result.pages[1].feed).toEqual([{post: other}])
  expect(result.pages[1].feed[0]).toEqual(data.pages[1].feed[1])
})

it('does not duplicate a replacement that is already in the feed', () => {
  const {result} = setupFeed([[{post: original}], [{post: replacement}]])
  expect(result.pages[0].feed).toEqual([])
  expect(result.pages[1].feed).toEqual([{post: replacement}])
})

it('preserves unrelated feed pages and quoted records', () => {
  const quoted = {
    ...replacement,
    embed: {record: original},
  } as unknown as app.bsky.feed.defs.PostView
  const {data, result} = setupFeed([[{post: quoted}]])
  expect(result).toBe(data)
})

it('uses the post loaded by the composer without another appview lookup', async () => {
  const client = new QueryClient()
  const key = ['post-feed', 'following', {}]
  client.setQueryData(key, {pages: [{feed: [{post: original}]}]})
  const getPost = jest.fn().mockRejectedValue(new Error('not indexed'))
  const deletePost = jest.fn().mockResolvedValue(undefined)
  await completeRedraftedPost({
    queryClient: client,
    uri: original.uri,
    replacement,
    getPost,
    deletePost,
  })
  expect(getPost).not.toHaveBeenCalled()
  expect(deletePost).toHaveBeenCalledTimes(1)
  expect(client.getQueryData(key)).toEqual({
    pages: [{feed: [{post: replacement}]}],
  })
})

it('waits for appview indexing before deleting the original', async () => {
  jest.useFakeTimers()
  try {
    const getPost = jest
      .fn()
      .mockRejectedValueOnce(new Error('not indexed'))
      .mockResolvedValue(replacement)
    const deletePost = jest.fn().mockResolvedValue(undefined)
    const pending = completeRedraftedPost({
      queryClient: new QueryClient(),
      uri: original.uri,
      getPost,
      deletePost,
    })
    expect(deletePost).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1000)
    await pending
    expect(getPost).toHaveBeenCalledTimes(2)
    expect(deletePost).toHaveBeenCalledTimes(1)
  } finally {
    jest.useRealTimers()
  }
})

it('keeps the original when the replacement cannot be loaded', async () => {
  jest.useFakeTimers()
  try {
    const client = new QueryClient()
    const key = ['post-feed', 'following', {}]
    const data = {pages: [{feed: [{post: original}]}]}
    client.setQueryData(key, data)
    const getPost = jest.fn().mockRejectedValue(new Error('not indexed'))
    const deletePost = jest.fn().mockResolvedValue(undefined)
    const pending = completeRedraftedPost({
      queryClient: client,
      uri: original.uri,
      getPost,
      deletePost,
    })
    const assertion = expect(pending).rejects.toThrow('not indexed')
    await jest.advanceTimersByTimeAsync(5000)
    await assertion
    expect(getPost).toHaveBeenCalledTimes(5)
    expect(deletePost).not.toHaveBeenCalled()
    expect(client.getQueryData(key)).toBe(data)
  } finally {
    jest.useRealTimers()
  }
})

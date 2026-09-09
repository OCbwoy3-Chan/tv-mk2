import {type app} from '#/lexicons'
import {replacePostInData} from './replace-redrafted-post'

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

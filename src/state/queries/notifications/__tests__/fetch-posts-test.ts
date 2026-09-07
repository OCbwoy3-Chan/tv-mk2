import {type Client, XrpcResponseError} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {app} from '#/lexicons'
import {fetchNotificationPosts} from '../fetch-posts'

function serverError(status: number) {
  return new XrpcResponseError(
    app.bsky.feed.getPosts.main,
    new Response(null, {status}),
    {encoding: 'application/json', body: {error: 'Failure'}},
  )
}
const uris = ['at://did:plc:a/app.bsky.feed.post/a', 'at://did:plc:a/app.bsky.feed.post/b', 'at://did:plc:a/app.bsky.feed.post/c'] as AtUriString[]

it('keeps healthy posts when one post breaks a notification batch', async () => {
  const call = jest.fn((_method, {uris: batch}: {uris: string[]}) => {
    if (batch.includes(uris[1])) throw serverError(500)
    return Promise.resolve({posts: batch.map(uri => ({uri}))})
  })
  const posts = await fetchNotificationPosts({call} as unknown as Client, uris)
  expect(posts.map(post => post.uri)).toEqual([uris[0], uris[2]])
  expect(call).toHaveBeenCalledTimes(5)
})

it.each([401, 403, 429])('preserves HTTP %s errors without splitting', async status => {
  const error = serverError(status)
  const call = jest.fn().mockRejectedValue(error)
  await expect(fetchNotificationPosts({call} as unknown as Client, uris)).rejects.toBe(error)
  expect(call).toHaveBeenCalledTimes(1)
})

it('preserves network errors', async () => {
  const error = new TypeError('Failed to fetch')
  const call = jest.fn().mockRejectedValue(error)
  await expect(fetchNotificationPosts({call} as unknown as Client, uris)).rejects.toBe(error)
  expect(call).toHaveBeenCalledTimes(1)
})

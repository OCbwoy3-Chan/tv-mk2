import {getMain, XrpcResponseError} from '@atproto/lex'

import {
  isBlackskySearchUpstreamFailure,
  isSearchV2Unavailable,
} from '#/state/queries/search-fallback'
import {app} from '#/lexicons'

function error(status: number, code: string, message: string) {
  return new XrpcResponseError(
    getMain(app.bsky.feed.searchPostsV2),
    new Response(null, {status}),
    {encoding: 'application/json', body: {error: code, message}},
  )
}

it('recognizes Blacksky disabled v2 response', () => {
  expect(
    isSearchV2Unavailable(
      error(400, 'InvalidRequest', 'Search v2 is not enabled'),
    ),
  ).toBe(true)
})

it('recognizes missing endpoints', () => {
  expect(
    isSearchV2Unavailable(error(501, 'MethodNotImplemented', 'Unavailable')),
  ).toBe(true)
  expect(isSearchV2Unavailable(error(404, 'NotFound', 'Not found'))).toBe(true)
})

it('does not hide query, authentication, rate-limit or network errors', () => {
  for (const e of [
    error(400, 'InvalidRequest', 'Invalid query'),
    error(401, 'AuthRequired', 'Login required'),
    error(429, 'RateLimitExceeded', 'Slow down'),
    new Error('Network failure'),
  ]) {
    expect(isSearchV2Unavailable(e)).toBe(false)
  }
})

it('recognizes only the Blacksky upstream failure for public search fallback', () => {
  expect(
    isBlackskySearchUpstreamFailure(
      error(502, 'InternalServerError', 'Failed to perform upstream request'),
    ),
  ).toBe(true)
  expect(
    isBlackskySearchUpstreamFailure(
      error(400, 'InvalidRequest', 'Invalid query'),
    ),
  ).toBe(false)
  expect(
    isBlackskySearchUpstreamFailure(
      error(401, 'AuthRequired', 'Login required'),
    ),
  ).toBe(false)
  expect(isBlackskySearchUpstreamFailure(new Error('Network failure'))).toBe(
    false,
  )
})

import {getMain, XrpcResponseError} from '@atproto/lex'

import {canFallbackToGeneralSuggestions} from '#/state/queries/trending/suggested-users-fallback'
import {app} from '#/lexicons'

function error(status: number, code: string, message: string) {
  return new XrpcResponseError(
    getMain(app.bsky.unspecced.getSuggestedUsersForExplore),
    new Response(null, {status}),
    {encoding: 'application/json', body: {error: code, message}},
  )
}

it('falls back for the observed Blacksky and Bluesky service failures', () => {
  expect(
    canFallbackToGeneralSuggestions(
      error(501, 'MethodNotImplemented', 'Suggestions agent not available'),
    ),
  ).toBe(true)
  expect(
    canFallbackToGeneralSuggestions(
      error(
        400,
        'InvalidRequest',
        'Upstream server responded with a 400 error',
      ),
    ),
  ).toBe(true)
})

it('preserves authentication, input, rate-limit, and network failures', () => {
  for (const failure of [
    error(401, 'AuthRequired', 'Login required'),
    error(403, 'InsufficientScope', 'Permission required'),
    error(400, 'InvalidRequest', 'Invalid category'),
    error(429, 'RateLimitExceeded', 'Slow down'),
    new Error('Network failure'),
  ]) {
    expect(canFallbackToGeneralSuggestions(failure)).toBe(false)
  }
})

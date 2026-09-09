import {isEphemeralAuthError} from '../ephemeral-auth'

it.each([
  {status: 401},
  {status: 403, error: 'ScopeMissing'},
  new Error('Please authorize this account for the selected app server'),
  {name: 'TokenRevokedError'},
  {cause: {error: 'invalid_grant'}},
])('offers login for an authentication failure: %p', error => {
  expect(isEphemeralAuthError(error)).toBe(true)
})

it.each([
  new Error('Failed to fetch'),
  {status: 500},
  {status: 403, error: 'BlockedActor'},
  {status: 429},
])('does not offer login for an unrelated action error: %p', error => {
  expect(isEphemeralAuthError(error)).toBe(false)
})

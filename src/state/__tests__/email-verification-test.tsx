import {Text} from 'react-native'
import {render, screen} from '@testing-library/react-native'

let mockEmailConfirmed: boolean | undefined
jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: {
      did: 'did:plc:alice',
      service: 'https://bsky.social',
      isOauthSession: true,
      emailConfirmed: mockEmailConfirmed,
    },
  }),
}))
jest.mock('#/state/queries/profile', () => ({
  useProfileQuery: () => ({data: {createdAt: '2026-01-01T00:00:00Z'}}),
}))
jest.mock('#/state/service-config', () => ({
  useCheckEmailConfirmed: () => true,
}))

import {Provider, useEmail} from '../email-verification'

function Consumer() {
  const {needsEmailVerification} = useEmail()
  return <Text>{needsEmailVerification ? 'blocked' : 'allowed'}</Text>
}

it.each([
  [undefined, 'allowed'],
  [true, 'allowed'],
  [false, 'blocked'],
] as const)('handles email status %s as %s', (status, expected) => {
  mockEmailConfirmed = status
  render(
    <Provider>
      <Consumer />
    </Provider>,
  )
  expect(screen.getByText(expected)).toBeTruthy()
})

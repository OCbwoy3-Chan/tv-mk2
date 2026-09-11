import {shouldRequestEmailConfirmation} from '../reminders'

jest.mock('#/state/persisted', () => ({get: () => ({})}))
jest.mock('../onboarding', () => ({isOnboardingActive: () => false}))

it.each([
  [undefined, false],
  [true, false],
  [false, true],
] as const)(
  'only reminds explicitly unverified accounts (%s)',
  (emailConfirmed, expected) => {
    expect(
      shouldRequestEmailConfirmation({
        did: 'did:plc:alice',
        handle: 'alice.test',
        service: 'https://bsky.social',
        isOauthSession: true,
        emailConfirmed,
      }),
    ).toBe(expected)
  },
)

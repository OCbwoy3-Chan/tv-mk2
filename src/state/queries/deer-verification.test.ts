import {createElement} from 'react'
import {useQuery} from '@tanstack/react-query'
import {renderToStaticMarkup} from 'react-dom/server'

import {useDeerVerificationTrustAppView} from '#/state/preferences/deer-verification'
import {type AnyProfileView} from '#/types/bsky/profile'
import {useDeerVerificationState} from './deer-verification'

jest.mock('@tanstack/react-query', () => ({useQuery: jest.fn()}))
jest.mock('#/state/queries', () => ({STALE: {HOURS: {ONE: 3_600_000}}}))
jest.mock('#/lib/hooks/useDeferredEnable', () => ({
  useDeferredEnable: () => false,
}))
jest.mock('#/state/preferences/constellation-instance', () => ({
  useConstellationInstance: () => 'https://constellation.test',
}))
jest.mock('#/state/preferences/deer-verification', () => ({
  useDeerVerificationTrusted: () => new Set(['did:plc:trusted']),
  useDeerVerificationTrustAppView: jest.fn(() => true),
}))
jest.mock('./direct-fetch-record', () => ({LRU: class {}}))
jest.mock('./resolve-identity', () => ({resolvePdsServiceUrl: jest.fn()}))
jest.mock('./constellation', () => ({
  asUri: (link: {did: string; collection: string; rkey: string}) =>
    `at://${link.did}/${link.collection}/${link.rkey}`,
}))

const profile: AnyProfileView = {
  did: 'did:plc:trusted',
  handle: 'author.test',
  verification: {
    trustedVerifierStatus: 'valid',
    verifiedStatus: 'valid',
    verifications: [
      {
        issuer: 'did:plc:issuer',
        uri: 'at://did:plc:issuer/app.bsky.graph.verification/1',
        isValid: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  },
}

beforeEach(() => {
  jest
    .mocked(useQuery)
    .mockReturnValue({data: undefined} as ReturnType<typeof useQuery>)
  jest.mocked(useDeerVerificationTrustAppView).mockReturnValue(true)
})

it('keeps existing badges while a navigation defers the lookup', () => {
  expect(renderVerificationState()).toEqual(profile.verification)
  expect(useQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({enabled: false, subscribed: true}),
  )
})

it('keeps locally trusted verifiers without trusting AppView badges', () => {
  jest.mocked(useDeerVerificationTrustAppView).mockReturnValue(false)
  expect(renderVerificationState()).toEqual({
    trustedVerifierStatus: 'valid',
    verifiedStatus: 'none',
    verifications: [],
  })
})

it('uses cached verification records even before interactions settle', () => {
  jest.mocked(useQuery).mockReturnValue({
    data: [
      {
        link: {
          did: 'did:plc:issuer',
          collection: 'app.bsky.graph.verification',
          rkey: '1',
        },
        record: {
          displayName: '',
          handle: profile.handle,
          createdAt: '2026-01-01T00:00:00Z',
        },
      },
    ],
  } as ReturnType<typeof useQuery>)
  jest.mocked(useDeerVerificationTrustAppView).mockReturnValue(false)
  expect(renderVerificationState()).toEqual(profile.verification)
})

function renderVerificationState() {
  let result: ReturnType<typeof useDeerVerificationState>
  function Probe() {
    result = useDeerVerificationState({profile, enabled: true})
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  return result
}

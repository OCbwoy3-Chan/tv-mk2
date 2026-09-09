import {DEFAULT_ACTIVE_THEME} from '#/features/themes/catalog'
import {activeThemeToScheme} from '#/features/themes/semanticTheme'
import type * as bsky from '#/types/bsky'
import {verificationBadges} from './badges'
import {verifierColor} from './verifier-color'

const theme = activeThemeToScheme(DEFAULT_ACTIVE_THEME)!.dark

const profile: bsky.profile.AnyProfileView = {
  did: 'did:plc:subject',
  handle: 'subject.test',
  verification: {
    trustedVerifierStatus: 'valid',
    verifiedStatus: 'valid',
    verifications: [
      {
        issuer: 'did:plc:b',
        uri: 'at://did:plc:b/app.bsky.graph.verification/1',
        isValid: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        issuer: 'did:plc:a',
        uri: 'at://did:plc:a/app.bsky.graph.verification/1',
        isValid: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        issuer: 'did:plc:a',
        uri: 'at://did:plc:a/app.bsky.graph.verification/2',
        isValid: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        issuer: 'did:plc:c',
        uri: 'at://did:plc:c/app.bsky.graph.verification/1',
        isValid: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  },
}

it('separates the subject’s verifier status from distinct valid received verifications', () => {
  expect(verificationBadges(profile, true)).toEqual([
    {kind: 'verifier', did: profile.did},
    {kind: 'verification', issuer: 'did:plc:a'},
    {kind: 'verification', issuer: 'did:plc:b'},
  ])
})

it('keeps the scalloped badge separate when received verifications are combined', () => {
  expect(verificationBadges(profile, false)).toEqual([
    {kind: 'verifier', did: profile.did},
    {kind: 'verification'},
  ])
})

it('does not imply a verifier has received a verification', () => {
  const verifierOnly = {
    ...profile,
    verification: {
      ...profile.verification!,
      verifiedStatus: 'none',
      verifications: [],
    },
  }
  expect(verificationBadges(verifierOnly, true)).toEqual([
    {kind: 'verifier', did: profile.did},
  ])
})

it('does not turn received verifications into scalloped badges', () => {
  const recipient = {
    ...profile,
    verification: {...profile.verification!, trustedVerifierStatus: 'none'},
  }
  expect(
    verificationBadges(recipient, true).every(
      badge => badge.kind === 'verification',
    ),
  ).toBe(true)
})

it('keeps badge identities and colors independent of viewer state and record ordering', () => {
  const otherView = {
    ...profile,
    viewer: {muted: true},
    verification: {
      ...profile.verification!,
      verifications: [...profile.verification!.verifications].reverse(),
    },
  }
  expect(verificationBadges(otherView, true)).toEqual(
    verificationBadges(profile, true),
  )
  const original = verifierColor(profile.did, theme)
  verifierColor('did:plc:another-viewing-account', theme)
  expect(verifierColor(otherView.did, theme)).toBe(original)
  expect(verifierColor('did:plc:a', theme)).not.toBe(
    verifierColor('did:plc:b', theme),
  )
})

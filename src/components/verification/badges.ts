import type * as bsky from '#/types/bsky'

export type VerificationBadge =
  {kind: 'verifier'; did: string} | {kind: 'verification'; issuer?: string}

/** Shared by interactive headers and non-interactive feed/profile rows. */
export function verificationBadges(
  profile: bsky.profile.AnyProfileView,
  perVerifier: boolean,
): VerificationBadge[] {
  const result: VerificationBadge[] = []
  const verification = profile.verification
  if (verification?.trustedVerifierStatus === 'valid') {
    result.push({kind: 'verifier', did: profile.did})
  }
  const issuers = [
    ...new Set(
      verification?.verifications.filter(v => v.isValid).map(v => v.issuer),
    ),
  ].sort()
  if (perVerifier) {
    result.push(
      ...issuers.map(issuer => ({kind: 'verification' as const, issuer})),
    )
  } else if (verification?.verifiedStatus === 'valid' || issuers.length) {
    result.push({kind: 'verification'})
  }
  return result
}

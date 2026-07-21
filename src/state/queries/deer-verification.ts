import {
  type AppBskyActorDefs,
  AppBskyGraphVerification,
  AtUri,
} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {useDeferredEnable} from '#/lib/hooks/useDeferredEnable'
import {STALE} from '#/state/queries'
import * as bsky from '#/types/bsky'
import {type AnyProfileView} from '#/types/bsky/profile'
import {useConstellationInstance} from '../preferences/constellation-instance'
import {
  useDeerVerificationEnabled,
  useDeerVerificationTrustAppView,
  useDeerVerificationTrusted,
} from '../preferences/deer-verification'
import {
  asUri,
  asyncGenCollect,
  asyncGenDedupe,
  asyncGenFilter,
  asyncGenTryMap,
  type ConstellationLink,
  constellationLinks,
} from './constellation'
import {LRU} from './direct-fetch-record'
import {resolvePdsServiceUrl} from './resolve-identity'

const RQKEY_ROOT = 'deer-verification'
export const RQKEY = (did: string, trusted: Set<string>) => [
  RQKEY_ROOT,
  did,
  Array.from(trusted).sort(),
]

type LinkedRecord = {
  link: ConstellationLink
  record: AppBskyGraphVerification.Record
}

const verificationCache = new LRU<string, any>()

export function getTrustedConstellationVerifications(
  instance: string,
  did: string,
  trusted: Set<string>,
) {
  const urip = new AtUri(did)
  const verificationLinks = constellationLinks(instance, {
    target: urip.host,
    collection: 'app.bsky.graph.verification',
    path: '.subject',
    from_dids: Array.from(trusted),
  })
  return asyncGenDedupe(
    asyncGenFilter(verificationLinks, link => trusted.has(link.did)),
    link => link.did,
  )
}

async function getDeerVerificationLinkedRecords(
  instance: string,
  did: string,
  trusted: Set<string>,
): Promise<LinkedRecord[] | undefined> {
  try {
    const trustedVerificationLinks = getTrustedConstellationVerifications(
      instance,
      did,
      trusted,
    )

    const verificationRecords = asyncGenFilter(
      asyncGenTryMap<ConstellationLink, {link: ConstellationLink; record: any}>(
        trustedVerificationLinks,
        // using try map lets us:
        // - cache the service url and verificatin record in independent lrus
        // - clear the promise from the lru on failure
        // - skip links that cause errors
        async link => {
          let service = await resolvePdsServiceUrl(link.did)

          const request = `${service}/xrpc/com.atproto.repo.getRecord?repo=${link.did}&collection=app.bsky.graph.verification&rkey=${link.rkey}`
          const record = await verificationCache.getOrTryInsertWith(
            request,
            async () => {
              const resp = (await (await fetch(request)).json()) as {
                value?: unknown
              }
              return resp.value
            },
          )
          return {link, record}
        },
        (_, e) => {
          console.error(e)
        },
      ),
      // the explicit return type shouldn't be needed...
      (d: {link: ConstellationLink; record: unknown}): d is LinkedRecord =>
        bsky.validate<AppBskyGraphVerification.Record>(
          d.record,
          AppBskyGraphVerification.validateRecord,
        ),
    )

    // Array.fromAsync will do this but not available everywhere yet
    return asyncGenCollect(verificationRecords)
  } catch (e) {
    console.error(e)
    return undefined
  }
}

function createVerificationViews(
  linkedRecords: LinkedRecord[],
  profile: AnyProfileView,
): AppBskyActorDefs.VerificationView[] {
  return linkedRecords.map(({link, record}) => ({
    issuer: link.did,
    isValid:
      (profile.displayName ?? '') === record.displayName &&
      profile.handle === record.handle,
    createdAt: record.createdAt,
    uri: asUri(link),
  }))
}

function mergeVerificationViews(
  appViewVerifications: AppBskyActorDefs.VerificationView[],
  deerVerifications: AppBskyActorDefs.VerificationView[],
) {
  const merged = new Map<string, AppBskyActorDefs.VerificationView>()

  for (const verification of appViewVerifications) {
    merged.set(verification.uri, verification)
  }

  for (const verification of deerVerifications) {
    merged.set(verification.uri, verification)
  }

  return Array.from(merged.values())
}

function createVerificationState(
  appViewVerifications: AppBskyActorDefs.VerificationView[],
  deerVerifications: AppBskyActorDefs.VerificationView[],
  profile: AnyProfileView,
  trusted: Set<string>,
  trustAppView: boolean,
): AppBskyActorDefs.VerificationState {
  const verifications = mergeVerificationViews(
    appViewVerifications,
    deerVerifications,
  )
  const appViewTrustedVerifierStatus = trustAppView
    ? profile.verification?.trustedVerifierStatus
    : undefined
  const trustedVerifierStatus = trusted.has(profile.did)
    ? 'valid'
    : (appViewTrustedVerifierStatus ?? 'none')

  return {
    verifications,
    verifiedStatus:
      verifications.length > 0
        ? verifications.findIndex(v => v.isValid) !== -1
          ? 'valid'
          : 'invalid'
        : 'none',
    trustedVerifierStatus,
  }
}

export function useDeerVerificationState({
  profile,
  enabled,
}: {
  profile: AnyProfileView | undefined
  enabled?: boolean
}) {
  const instance = useConstellationInstance()
  const trusted = useDeerVerificationTrusted()
  const trustAppView = useDeerVerificationTrustAppView()
  const deferredEnabled = useDeferredEnable(Boolean(enabled && profile))

  const linkedRecords = useQuery<LinkedRecord[] | undefined>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(profile?.did || '', trusted),
    async queryFn() {
      if (!profile) return undefined

      return await getDeerVerificationLinkedRecords(
        instance,
        profile.did,
        trusted,
      )
    },
    enabled: deferredEnabled,
    subscribed: deferredEnabled,
  })

  if (linkedRecords.data === undefined || profile === undefined) return
  const deerVerifications = createVerificationViews(linkedRecords.data, profile)
  const verificationState = createVerificationState(
    trustAppView ? (profile.verification?.verifications ?? []) : [],
    deerVerifications,
    profile,
    trusted,
    trustAppView,
  )

  return verificationState
}

export function useDeerVerificationProfileOverlay<V extends AnyProfileView>(
  profile: V,
): V {
  const enabled = useDeerVerificationEnabled()
  const verificationState = useDeerVerificationState({
    profile,
    enabled,
  })

  return enabled
    ? {
        ...profile,
        verification: verificationState,
      }
    : profile
}

export function useMaybeDeerVerificationProfileOverlay<
  V extends AnyProfileView,
>(profile: V | undefined): V | undefined {
  const enabled = useDeerVerificationEnabled()
  const verificationState = useDeerVerificationState({
    profile,
    enabled,
  })

  if (!profile) return undefined

  return enabled
    ? {
        ...profile,
        verification: verificationState,
      }
    : profile
}

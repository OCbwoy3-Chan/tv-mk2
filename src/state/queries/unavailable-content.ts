import {isDid} from '@atproto/api'
import {AtUri} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {isValidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {STALE} from '#/state/queries'
import {useProfileQuery} from '#/state/queries/profile'
import {
  type DidDocument,
  resolvePdsServiceUrl,
  useDidDocument,
} from '#/state/queries/resolve-identity'
import {createQueryKey} from '#/state/queries/util'

/** DID aliases are display hints, not verified identities for navigation. */
export function getUnavailableHandle(
  doc: DidDocument | undefined,
  did: string,
) {
  if (doc?.id !== did || !Array.isArray(doc.alsoKnownAs)) return
  for (const alias of doc.alsoKnownAs) {
    if (typeof alias !== 'string' || !alias.startsWith('at://')) continue
    const handle = alias.slice(5)
    if (isValidHandle(handle) && !handle.toLowerCase().endsWith('.invalid')) {
      return handle
    }
  }
}

export function useUnavailableAccountLabel(did: string, enabled = true) {
  const {data} = useDidDocument({did: enabled ? did : ''})
  const handle = getUnavailableHandle(data, did)
  return handle ? sanitizeHandle(handle, '@') : did
}

/** Keep unavailable handles out of chat labels without changing account state. */
export function useUnavailableProfileLabel(
  profile: {did: string; handle: string} | undefined,
) {
  const unavailable = profile?.handle === 'missing.invalid'
  const label = useUnavailableAccountLabel(profile?.did ?? '', unavailable)
  return unavailable ? label : undefined
}

export type UnavailablePostStatus = 'deleted' | 'account' | 'unknown'

/** Only a record-specific failure establishes that the post is gone. */
export function classifyUnavailablePost(error: unknown): UnavailablePostStatus {
  if (error === 'RecordNotFound') return 'deleted'
  if (
    error === 'RepoNotFound' ||
    error === 'RepoDeactivated' ||
    error === 'RepoTakendown' ||
    error === 'AccountNotFound' ||
    error === 'AccountDeactivated' ||
    error === 'AccountTakedown' ||
    error === 'AccountSuspended'
  ) {
    return 'account'
  }
  return 'unknown'
}

/** AppView reports missing profiles as InvalidRequest, including unavailable accounts. */
export function isUnavailableProfileError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'error' in error ? error.error : undefined
  if (classifyUnavailablePost(code) === 'account') return true
  return (
    code === 'InvalidRequest' &&
    'message' in error &&
    error.message === 'Profile not found'
  )
}

const useUnavailablePostQueryRoot = 'unavailable-post'

export function useUnavailablePostQuery(uri: string) {
  const post = new AtUri(uri)
  const profile = useProfileQuery({did: post.host})
  const result = useQuery({
    queryKey: createQueryKey(useUnavailablePostQueryRoot, {uri}),
    staleTime: STALE.MINUTES.FIVE,
    retry: false,
    async queryFn({signal}): Promise<UnavailablePostStatus> {
      const post = new AtUri(uri)
      if (!isDid(post.host)) return 'unknown'
      const pds = await resolvePdsServiceUrl(post.host)
      if (!pds) return 'unknown'
      const url = new URL('/xrpc/com.atproto.repo.getRecord', pds)
      if (url.protocol !== 'https:') return 'unknown'
      url.searchParams.set('repo', post.host)
      url.searchParams.set('collection', post.collection)
      url.searchParams.set('rkey', post.rkey)
      const response = await fetch(url.toString(), {signal})
      if (response.ok) return 'unknown'
      const body = (await response.json()) as {error?: unknown}
      return classifyUnavailablePost(body.error)
    },
  })
  return {
    ...result,
    data: isUnavailableProfileError(profile.error)
      ? ('account' as const)
      : result.data,
  }
}

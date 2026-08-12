import {useQuery} from '@tanstack/react-query'

import {useFaviconService} from '#/state/preferences/favicon-service'
import {GCTIME} from '#/state/queries'
import {
  getFaviconServiceUrl,
  getPdsFallbackFaviconUrl,
  isBridgedPdsUrl,
  isBskyPdsUrl,
} from '#/state/queries/pds-label.util'
import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {createQueryKey} from '#/state/queries/util'

export {getPdsFallbackFaviconUrl, isBridgedPdsUrl, isBskyPdsUrl}

export const RQKEY_ROOT = 'pds-label'
export const RQKEY = (did: string) =>
  createQueryKey(RQKEY_ROOT, {did}, {persistedVersion: 1})

export function usePdsLabelQuery(did: string | undefined) {
  return useQuery({
    queryKey: RQKEY(did ?? ''),
    queryFn: async () => {
      if (!did) return null
      const pdsUrl = await resolvePdsServiceUrl(
        did as `did:${string}:${string}`,
      )
      if (!pdsUrl) return undefined
      const isBsky = isBskyPdsUrl(pdsUrl)
      const isBridged = isBridgedPdsUrl(pdsUrl)
      return {pdsUrl, isBsky, isBridged}
    },
    enabled: !!did,
    subscribed: !!did,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: GCTIME.INFINITY,
  })
}

export const RQKEY_FAVICON_ROOT = 'pds-favicon'
export const RQKEY_FAVICON = (pdsUrl: string, faviconService: string) => [
  RQKEY_FAVICON_ROOT,
  pdsUrl,
  faviconService,
]

export function usePdsFaviconQuery(pdsUrl: string | undefined) {
  const faviconService = useFaviconService()
  const isEnabled = Boolean(pdsUrl && faviconService)
  const queryKey = isEnabled
    ? RQKEY_FAVICON(pdsUrl!, faviconService!)
    : ['pds-favicon-disabled']

  return useQuery({
    queryKey,
    queryFn: () =>
      isEnabled ? getFaviconServiceUrl(pdsUrl!, faviconService!) : undefined,
    enabled: isEnabled,
    subscribed: isEnabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

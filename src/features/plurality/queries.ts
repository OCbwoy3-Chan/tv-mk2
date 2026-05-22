import {type Did} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {LRU} from '#/state/queries/direct-fetch-record'
import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {
  PLURAL_FRONT_LOG_COLLECTION,
  PLURAL_SYSTEM_MEMBER_COLLECTION,
  type PluralFrontLog,
  type PluralFrontingData,
  type PluralSystemMember,
} from '#/features/plurality/types'

const RQKEY_ROOT = 'plural-fronting'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

const pdsCache = new LRU<string, unknown>()

type ListRecordsResponse = {
  records: {uri: string; cid: string; value: unknown}[]
  cursor?: string
}

type GetRecordResponse = {
  uri: string
  cid: string
  value: unknown
}

async function pdsFetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`PDS request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

function pdsXrpcUrl(
  pdsUrl: string,
  method: string,
  params: Record<string, string>,
): string {
  const base = pdsUrl.endsWith('/') ? pdsUrl.slice(0, -1) : pdsUrl
  const url = new URL(`${base}/xrpc/${method}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

async function listPluralRecords(
  pdsUrl: string,
  repo: string,
  collection: string,
): Promise<unknown[]> {
  const records: unknown[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = {
      repo,
      collection,
      limit: '100',
    }
    if (cursor) params.cursor = cursor

    const url = pdsXrpcUrl(pdsUrl, 'com.atproto.repo.listRecords', params)
    const page = await pdsCache.getOrTryInsertWith(url, () =>
      pdsFetchJson<ListRecordsResponse>(url),
    ) as ListRecordsResponse

    for (const record of page.records) {
      records.push(record.value)
    }
    cursor = page.cursor
  } while (cursor)

  return records
}

async function getPluralMember(
  pdsUrl: string,
  repo: string,
  rkey: string,
): Promise<PluralSystemMember | undefined> {
  const url = pdsXrpcUrl(pdsUrl, 'com.atproto.repo.getRecord', {
    repo,
    collection: PLURAL_SYSTEM_MEMBER_COLLECTION,
    rkey,
  })

  try {
    const res = (await pdsCache.getOrTryInsertWith(url, () =>
      pdsFetchJson<GetRecordResponse>(url),
    )) as GetRecordResponse
    return res.value as PluralSystemMember
  } catch {
    return undefined
  }
}

export async function fetchPluralFronting(
  did: string,
): Promise<PluralFrontingData | undefined> {
  try {
    const pdsUrl = await resolvePdsServiceUrl(did as Did)
    if (!pdsUrl) return undefined

    const logs = (await listPluralRecords(
      pdsUrl,
      did,
      PLURAL_FRONT_LOG_COLLECTION,
    )) as PluralFrontLog[]

    if (logs.length === 0) return undefined

    const orderedLogs = logs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const lastLog = orderedLogs[0]
    const fronterIds = lastLog?.fronters
    if (!fronterIds || fronterIds.length === 0) return undefined

    const members = (
      await Promise.all(
        fronterIds.map(rkey => getPluralMember(pdsUrl, did, rkey)),
      )
    ).filter((m): m is PluralSystemMember => !!m && m.visibility === 'public')

    if (members.length === 0) return undefined

    return {pdsUrl, fronters: members}
  } catch (e) {
    console.error(e)
    return undefined
  }
}

export function usePluralFrontingQuery({did}: {did: string}) {
  return useQuery({
    queryKey: RQKEY(did),
    staleTime: STALE.MINUTES.FIVE,
    enabled: !!did,
    queryFn: () => fetchPluralFronting(did),
  })
}

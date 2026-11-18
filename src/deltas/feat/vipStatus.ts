import { AtUri } from '@atproto/syntax'
import { useQuery } from '@tanstack/react-query'

import { useConstellationInstance } from '#/state/preferences/constellation-instance'
import { STALE } from '#/state/queries'
import { createQueryKey } from '#/state/queries/util'

/** Lists used only by the standalone VIP-status lookup. */
const DEFAULT_VIP_LIST_URIS = [
  'at://did:web:vessel.darkworld.download/app.bsky.graph.list/3msl7flumz422',
]

function readListUris(): string[] {
  const override: string | undefined = process.env.EXPO_PUBLIC_DECO_LIST_URIS
  if (!override) return DEFAULT_VIP_LIST_URIS
  return override
    .split(',')
    .map((uri: string) => uri.trim())
    .filter(Boolean)
}

/** Exact list URIs whose members have VIP status. */
export const VIP_LIST_URIS: readonly string[] = readListUris()

export const SUBSCRIBER_LIST_COLLECTION = 'app.bsky.graph.list'
export const SUBSCRIBER_LIST_ITEM_COLLECTION = 'app.bsky.graph.listitem'
const LIST_ITEM_SUBJECT_SOURCE = `${SUBSCRIBER_LIST_ITEM_COLLECTION}:subject`
const LIST_ITEM_LIST_PATH = 'list'

type GetManyToManyResponse = {
  items?: {
    linkRecord: { did: string; collection: string; rkey: string }
    otherSubject: string
  }[]
  cursor?: string | null
}

/**
 * Whether `subjectDid` belongs to any exact configured subscriber list.
 *
 * `did` restricts the linking record to the list owner, while the many-to-many
 * join verifies BOTH links in the same listitem: `list` points to the exact
 * configured list URI and `subject` points to this profile DID. This supports
 * ordinary list items created by Bluesky clients and needs no body fetch.
 */
export async function getVipStatus(
  subjectDid: string,
  constellationService: string,
  subscriberListUris: readonly string[],
): Promise<boolean> {
  const lists = new Map<string, string>()
  for (const configuredUri of subscriberListUris) {
    try {
      const parsed = new AtUri(configuredUri)
      if (
        parsed.collection === SUBSCRIBER_LIST_COLLECTION &&
        parsed.rkey &&
        parsed.host.startsWith('did:')
      ) {
        lists.set(parsed.toString(), parsed.host)
      }
    } catch {
      // A malformed configured URI cannot grant access.
    }
  }
  if (lists.size === 0) return false

  const url = new URL(
    '/xrpc/blue.microcosm.links.getManyToMany',
    constellationService,
  )
  url.searchParams.set('subject', subjectDid)
  url.searchParams.set('source', LIST_ITEM_SUBJECT_SOURCE)
  url.searchParams.set('pathToOther', LIST_ITEM_LIST_PATH)
  url.searchParams.set('limit', '100')
  for (const listUri of lists.keys()) {
    url.searchParams.append('otherSubject', listUri)
  }
  for (const ownerDid of new Set(lists.values())) {
    url.searchParams.append('did', ownerDid)
  }

  const res = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Constellation getManyToMany failed: ${res.status}`)
  }
  const json = (await res.json()) as GetManyToManyResponse
  return !!json.items?.some(
    item =>
      item.linkRecord.collection === SUBSCRIBER_LIST_ITEM_COLLECTION &&
      lists.get(item.otherSubject) === item.linkRecord.did,
  )
}

const useVipStatusQueryRoot = 'vipStatus'

/** VIP membership is independent of decoration access. */
export function useVipStatusQuery(did: string | undefined) {
  const constellation = useConstellationInstance()
  return useQuery({
    queryKey: createQueryKey(useVipStatusQueryRoot, {
      did,
      constellation,
      lists: VIP_LIST_URIS,
    }),
    enabled: !!did,
    staleTime: STALE.MINUTES.THIRTY,
    queryFn: () => getVipStatus(did!, constellation, VIP_LIST_URIS),
  })
}

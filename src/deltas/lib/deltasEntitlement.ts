import { AtUri } from '@atproto/syntax'
import { useQuery } from '@tanstack/react-query'

import { useConstellationInstance } from '#/state/preferences/constellation-instance'
import { STALE } from '#/state/queries'
import { createQueryKey } from '#/state/queries/util'

const ENTITLEMENT_LIST_COLLECTION = 'party.tenna.entitlement.list'
const ENTITLEMENT_LIST_ITEM_COLLECTION = 'party.tenna.entitlement.listitem'

type GetManyToManyResponse = {
  items?: {
    linkRecord: { did: string; collection: string; rkey: string }
    otherSubject: string
  }[]
  cursor?: string | null
}

/** Check whether a DID belongs to the exact entitlement list. */
export async function getDeltasEntitlement(
  listUri: string,
  subjectDid: string,
  constellationService: string,
): Promise<boolean> {
  let list: AtUri
  try {
    list = new AtUri(listUri)
    if (
      list.collection !== ENTITLEMENT_LIST_COLLECTION ||
      !list.rkey ||
      !list.host.startsWith('did:')
    ) {
      return false
    }
  } catch {
    // A malformed list URI cannot grant access.
    return false
  }

  const url = new URL(
    '/xrpc/blue.microcosm.links.getManyToMany',
    constellationService,
  )
  url.searchParams.set('subject', subjectDid)
  url.searchParams.set('source', `${ENTITLEMENT_LIST_ITEM_COLLECTION}:subject`)
  url.searchParams.set('pathToOther', 'list')
  url.searchParams.set('limit', '100')
  url.searchParams.set('otherSubject', list.toString())
  url.searchParams.set('did', list.host)

  const res = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Constellation getManyToMany failed: ${res.status}`)
  }
  const json = (await res.json()) as GetManyToManyResponse
  return !!json.items?.some(
    item =>
      item.linkRecord.collection === ENTITLEMENT_LIST_ITEM_COLLECTION &&
      item.otherSubject === list.toString() &&
      item.linkRecord.did === list.host,
  )
}

const useDeltasEntitlementQueryRoot = 'deltasEntitlement'

/** Check if a user belongs to the supplied Deltas entitlement list. */
export function useDeltasEntitlementQuery(
  listUri: string,
  did: string | undefined,
) {
  const constellation = useConstellationInstance()
  return useQuery({
    queryKey: createQueryKey(useDeltasEntitlementQueryRoot, {
      did,
      constellation,
      listUri,
    }),
    enabled: !!did && !!listUri,
    staleTime: STALE.MINUTES.THIRTY,
    queryFn: () => getDeltasEntitlement(listUri, did!, constellation),
  })
}

import {type Did, isDid} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {getDidDocumentUrl} from '#/lib/atproto/did'
import {readPlcDirectory} from '#/state/preferences/plc-directory'
import {createPublicAgent} from '#/state/session/agent'
import {STALE} from '.'
import {LRU} from './direct-fetch-record'
const RQKEY_ROOT = 'resolve-identity'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

// this isn't trusted...
export type DidDocument = {
  '@context'?: string[]
  id?: string
  alsoKnownAs?: string[]
  verificationMethod?: VerificationMethod[]
  service?: Service[]
}

export type VerificationMethod = {
  id?: string
  type?: string
  controller?: string
  publicKeyMultibase?: string
}

export type Service = {
  id?: string
  type?: string
  serviceEndpoint?: string
}

const serviceCache = new LRU<string, DidDocument>()

async function resolveDidDocumentUsingAppView(did: Did) {
  const agent = createPublicAgent()
  try {
    const res = await agent.com.atproto.identity.resolveDid({did})
    return res.data.didDoc as DidDocument
  } finally {
    agent.dispose()
  }
}

export async function resolveDidDocument(did: Did) {
  const plcDirectory = readPlcDirectory()
  const cacheKey = did.startsWith('did:plc:') ? `${plcDirectory}|${did}` : did

  return await serviceCache.getOrTryInsertWith(cacheKey, async () => {
    const docUrl = getDidDocumentUrl(did, plcDirectory)
    if (!docUrl) {
      throw new Error(`Unsupported DID method for ${did}`)
    }

    try {
      const res = await fetch(docUrl, {
        headers: {
          accept: 'application/did+ld+json, application/json',
        },
      })
      if (!res.ok) {
        throw new Error(`Failed to resolve DID document for ${did}`)
      }

      return (await res.json()) as DidDocument
    } catch (err) {
      if (!did.startsWith('did:web:')) {
        throw err
      }
      return await resolveDidDocumentUsingAppView(did)
    }
  })
}

export function findService(doc: DidDocument, id: string, type?: string) {
  // probably not defensive enough, but we don't have atproto/did as a dep...
  if (!Array.isArray(doc?.service)) return
  return doc.service.find(
    s => s?.serviceEndpoint && s?.id === id && (!type || s?.type === type),
  )
}

export async function resolvePdsServiceUrl(did: Did) {
  const doc = await resolveDidDocument(did)
  return findService(doc, '#atproto_pds', 'AtprotoPersonalDataServer')
    ?.serviceEndpoint
}

export function useDidDocument({did}: {did: string}) {
  return useQuery<DidDocument | undefined>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(did || ''),
    async queryFn() {
      if (!isDid(did)) return undefined
      return await resolveDidDocument(did)
    },
    enabled: isDid(did) && !(did.includes('#') || did.includes('?')),
  })
}

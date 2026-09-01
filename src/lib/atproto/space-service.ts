import {isDid} from '@atproto/api'

import {getDidDocumentUrl} from './did'

type AtprotoSpaceService = {
  id?: string
  type?: string
  serviceEndpoint?: string
}

type DidDocument = {
  service?: AtprotoSpaceService[]
}

const SPACE_SERVICE_TYPE = 'AtprotoSpaceService'

export const DEFAULT_PRIVATE_POSTS_APPVIEW_DID = 'did:web:tenna.party#private'

export async function resolveAtprotoSpaceServiceEndpoint(
  serviceRef: string,
  signal?: AbortSignal,
): Promise<string> {
  const hashIndex = serviceRef.indexOf('#')
  const did = hashIndex === -1 ? serviceRef : serviceRef.slice(0, hashIndex)
  const serviceId = hashIndex === -1 ? undefined : serviceRef.slice(hashIndex)

  if (!serviceId || !isDid(did)) {
    throw new Error('Invalid private posts AppView DID')
  }

  const didDocumentUrl = getDidDocumentUrl(did, 'https://plc.directory')
  if (!didDocumentUrl) {
    throw new Error('Unsupported private posts AppView DID')
  }

  const response = await fetch(didDocumentUrl, {
    headers: {accept: 'application/did+ld+json, application/json'},
    signal,
  })
  if (!response.ok) {
    throw new Error(`Could not fetch DID document (${response.status})`)
  }

  const document = (await response.json()) as DidDocument
  const service = document.service?.find(
    candidate =>
      candidate.id === serviceId &&
      candidate.type === SPACE_SERVICE_TYPE &&
      typeof candidate.serviceEndpoint === 'string',
  )

  if (!service?.serviceEndpoint) {
    throw new Error(
      `DID document does not declare ${SPACE_SERVICE_TYPE} ${serviceId}`,
    )
  }

  return service.serviceEndpoint
}

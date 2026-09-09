export type ThemeRecord = {
  name: string
  description?: string
  mode?: 'light' | 'dark'
  recommendedPair?: string
  base: {name: string; colors: Record<string, string>}
  variants?: {name: string; colors?: Record<string, string>}[]
  special?: {$type: string; accent?: string}
}

function didWebUrl(did: string) {
  const parts = did.slice('did:web:'.length).split(':').map(decodeURIComponent)
  const host = parts.shift()
  return parts.length
    ? `https://${host}/${parts.join('/')}/did.json`
    : `https://${host}/.well-known/did.json`
}

export async function resolveTheme(name: string, rkey: string) {
  let did = name
  let author = name
  if (!name.startsWith('did:')) {
    const profile = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(name)}`,
    )
    if (!profile.ok) throw new Error('Author not found')
    const value = (await profile.json()) as {did: string; handle?: string}
    did = value.did
    author = value.handle ?? name
  }
  const didDocumentUrl = did.startsWith('did:web:')
    ? didWebUrl(did)
    : `https://plc.directory/${encodeURIComponent(did)}`
  const didDocument = (await (await fetch(didDocumentUrl)).json()) as {
    service?: {id: string; type: string; serviceEndpoint: string}[]
  }
  const pds = didDocument.service?.find(service =>
    service.id.endsWith('#atproto_pds'),
  )?.serviceEndpoint
  if (!pds) throw new Error('PDS not found')
  const response = await fetch(
    `${pds}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=app.witchsky.theme.colors&rkey=${encodeURIComponent(rkey)}`,
  )
  if (!response.ok) throw new Error('Theme not found')
  const result = (await response.json()) as {
    uri: string
    cid: string
    value: ThemeRecord
  }
  return {...result, author, did}
}

export function themeColorSets(record: ThemeRecord) {
  return [
    record.base,
    ...(record.variants ?? []).map(variant => ({
      name: variant.name,
      colors: {...record.base.colors, ...variant.colors},
    })),
  ]
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character]!,
  )
}

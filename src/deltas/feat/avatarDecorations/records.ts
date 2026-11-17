import {type AvatarShape, isAvatarShape} from './avatarShapes'

/**
 * Cosmetic choices, a self-record in the owner's PDS, written directly by the
 * app with the user's session. One record holds every slot (avatar frame,
 * avatar shape, and name gradient). All accounts can use these choices.
 */
export const SETTINGS_COLLECTION = 'social.mu.deco.settings'
export const SETTINGS_RKEY = 'self'

/** Resolved slot ids from a settings record; each maps to its own catalog. */
export type DecorationSettings = {
  /** Avatar frame id (catalog.ts). */
  avatar?: string
  /** Preferred shape for this profile picture (avatarShapes.ts). */
  avatarShape?: AvatarShape
  /** Display-name gradient id (nameGradients.ts). */
  name?: string
  /** Draw a dark edge around the gradient name so it pops on any background. */
  nameOutline?: boolean
}

/**
 * Fetches the subject's decoration settings record. Goes through Slingshot
 * (microcosm's cached record fetcher) rather than the AppView: the AppView only
 * serves getRecord for collections it indexes (app.bsky.*), while Slingshot
 * resolves any DID to its PDS and edge-caches the record.
 */
export async function getDecorationSettings(
  did: string,
  slingshotService: string,
): Promise<DecorationSettings> {
  const url = new URL('/xrpc/com.atproto.repo.getRecord', slingshotService)
  url.searchParams.set('repo', did)
  url.searchParams.set('collection', SETTINGS_COLLECTION)
  url.searchParams.set('rkey', SETTINGS_RKEY)

  const res = await fetch(url.toString(), {
    headers: {accept: 'application/json'},
  })
  // Accounts without saved choices use the normal avatar and name.
  if (res.status === 400 || res.status === 404) {
    const body = (await res.json().catch(() => ({}))) as {error?: unknown}
    if (body.error === 'RecordNotFound') return {}
  }
  if (!res.ok) {
    throw new Error(`Slingshot getRecord failed: ${res.status}`)
  }
  const json = (await res.json()) as {value?: unknown}
  return parseDecorationSettings(json.value)
}

/** Ignores malformed optional slots received from a public record. */
export function parseDecorationSettings(value: unknown): DecorationSettings {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  return {
    ...(typeof record.avatar === 'string' ? {avatar: record.avatar} : {}),
    ...(isAvatarShape(record.avatarShape)
      ? {avatarShape: record.avatarShape}
      : {}),
    ...(typeof record.name === 'string' ? {name: record.name} : {}),
    ...(record.nameOutline === true ? {nameOutline: true} : {}),
  }
}

/**
 * Builds the record to write for `patch` over `current`. putRecord replaces the
 * whole record, so every other slot has to be carried over explicitly, and a
 * slot cleared in `patch` must be omitted rather than written as undefined.
 */
export function buildDecorationRecord(
  current: DecorationSettings,
  patch: Partial<DecorationSettings>,
): DecorationSettings & {$type: string; updatedAt: string} {
  const next: DecorationSettings = {...current, ...patch}
  return {
    $type: SETTINGS_COLLECTION,
    updatedAt: new Date().toISOString(),
    ...(next.avatar ? {avatar: next.avatar} : {}),
    ...(next.avatarShape ? {avatarShape: next.avatarShape} : {}),
    ...(next.name ? {name: next.name} : {}),
    // The outline only means anything alongside a gradient.
    ...(next.name && next.nameOutline ? {nameOutline: true} : {}),
  }
}

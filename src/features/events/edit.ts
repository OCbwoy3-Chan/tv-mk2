import {
  buildEventRecord,
  deviceTimezone,
  type EventDraft,
} from '#/lib/api/event'
import * as dt from '#/components/forms/DateTimeField/utils'
import {type ParsedEvent} from './record'
import {EVENT_COLLECTION} from './types'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toParts = (date: Date) => dt.toEventParts(dt.toDateTimeLocal(date))

/** The composer's event draft for an existing event, to edit it. */
export function eventDraftFromRecord(
  parsed: ParsedEvent,
): EventDraft | undefined {
  if (!parsed.startsAt) return
  const start = toParts(parsed.startsAt)
  const end = parsed.endsAt ? toParts(parsed.endsAt) : undefined
  return {
    name: parsed.name,
    description: parsed.description,
    date: start.date,
    time: start.time,
    endsDate: end?.date,
    endsTime: end?.time,
    timezone: parsed.timezone ?? deviceTimezone(),
    mode: parsed.mode ?? 'inperson',
    place: parsed.location ?? parsed.joinUrl,
  }
}

/**
 * The stored record with an edited draft applied. Only what the editor covers
 * changes: other apps' fields, extra links, the post ref, status and creation
 * time are kept. The place is only rewritten when it was edited, since the
 * draft holds one place while a record can hold several locations and links.
 */
export function applyEventEdit(
  raw: Record<string, unknown>,
  before: EventDraft,
  after: EventDraft,
): Record<string, unknown> {
  const built = buildEventRecord(after)
  const next: Record<string, unknown> = {
    ...raw,
    $type: EVENT_COLLECTION,
    name: built.name,
    startsAt: built.startsAt,
    timezone: built.timezone,
    mode: built.mode,
  }
  if (built.description) next.description = built.description
  else delete next.description
  if (built.endsAt) next.endsAt = built.endsAt
  else delete next.endsAt

  const oldPlace = before.place?.trim()
  if ((after.place?.trim() ?? '') !== (oldPlace ?? '')) {
    const isOldLink = (item: unknown) => isObject(item) && item.uri === oldPlace
    const uris = (Array.isArray(raw.uris) ? raw.uris : []).filter(
      item => !isOldLink(item),
    )
    // Link-type locations stay unless they were the old place; the named
    // location the editor showed is replaced.
    const locations = (
      Array.isArray(raw.locations) ? raw.locations : []
    ).filter(item => isObject(item) && 'uri' in item && !isOldLink(item))
    uris.push(...(built.uris ?? []))
    locations.push(...(built.locations ?? []))
    if (uris.length) next.uris = uris
    else delete next.uris
    if (locations.length) next.locations = locations
    else delete next.locations
  }
  return next
}

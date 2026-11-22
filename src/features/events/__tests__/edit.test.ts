import {describe, expect, it} from '@jest/globals'

import {type EventDraft} from '#/lib/api/event'
import {applyEventEdit, eventDraftFromRecord} from '../edit'
import {parseEventRecord} from '../record'

const RAW = {
  $type: 'community.lexicon.calendar.event',
  name: 'Picnic',
  description: 'Bring food',
  startsAt: '2026-12-01T12:00:00.000Z',
  endsAt: '2026-12-01T15:00:00.000Z',
  timezone: 'Europe/Berlin',
  mode: 'community.lexicon.calendar.event#inperson',
  status: 'community.lexicon.calendar.event#scheduled',
  createdAt: '2026-11-01T00:00:00.000Z',
  locations: [{name: 'The park'}],
  uris: [{uri: 'https://example.com/info', name: 'Info'}],
  bskyPostRef: {uri: 'at://did:plc:a/app.bsky.feed.post/1', cid: 'c'},
  'com.example.extra': true,
}

function draftOf(raw: Record<string, unknown> = RAW): EventDraft {
  return eventDraftFromRecord(parseEventRecord(raw)!)!
}

describe('eventDraftFromRecord', () => {
  it('reads the fields the editor covers', () => {
    const draft = draftOf()
    expect(draft).toMatchObject({
      name: 'Picnic',
      description: 'Bring food',
      timezone: 'Europe/Berlin',
      mode: 'inperson',
      place: 'The park',
    })
    expect(draft.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(draft.time).toMatch(/^\d{2}:\d{2}$/)
    expect(draft.endsDate).toBeDefined()
  })

  it('cannot draft an event without a start', () => {
    const {startsAt: _, ...noStart} = RAW
    expect(eventDraftFromRecord(parseEventRecord(noStart)!)).toBe(undefined)
  })
})

describe('applyEventEdit', () => {
  it('keeps what the editor does not cover', () => {
    const before = draftOf()
    const next = applyEventEdit(RAW, before, {...before, name: 'Big picnic'})
    expect(next).toMatchObject({
      name: 'Big picnic',
      createdAt: RAW.createdAt,
      status: RAW.status,
      bskyPostRef: RAW.bskyPostRef,
      'com.example.extra': true,
      locations: RAW.locations,
      uris: RAW.uris,
    })
  })

  it('round-trips the times unchanged', () => {
    const before = draftOf()
    const next = applyEventEdit(RAW, before, before)
    expect(next.startsAt).toBe(RAW.startsAt)
    expect(next.endsAt).toBe(RAW.endsAt)
  })

  it('drops a cleared description and end time', () => {
    const before = draftOf()
    const next = applyEventEdit(RAW, before, {
      ...before,
      description: '',
      endsDate: undefined,
      endsTime: undefined,
    })
    expect(next).not.toHaveProperty('description')
    expect(next).not.toHaveProperty('endsAt')
  })

  it('replaces the place only when it was edited', () => {
    const before = draftOf()
    const moved = applyEventEdit(RAW, before, {...before, place: 'The beach'})
    expect(moved.locations).toEqual([{name: 'The beach'}])
    expect(moved.uris).toEqual(RAW.uris)

    const online = applyEventEdit(RAW, before, {
      ...before,
      mode: 'virtual',
      place: 'https://meet.example/abc',
    })
    expect(online.locations).toBeUndefined()
    expect(online.uris).toEqual([
      ...RAW.uris,
      {uri: 'https://meet.example/abc', name: 'Join'},
    ])
  })
})

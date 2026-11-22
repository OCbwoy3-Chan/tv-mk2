import {type BlobRef} from '@atproto/lex'

import {coverMediaItem, eventHasContent, withCoverMedia} from '../event'

const blob = {ref: 'new'} as unknown as BlobRef
const cover = {blob, width: 600, height: 600}

describe('withCoverMedia', () => {
  it('swaps the thumbnail and keeps other media', () => {
    const media = [
      {role: 'thumbnail', content: {ref: 'old'}},
      {role: 'gallery', content: {ref: 'other'}},
    ]
    expect(withCoverMedia(media, cover)).toEqual([
      {role: 'gallery', content: {ref: 'other'}},
      coverMediaItem(cover),
    ])
  })

  it('removes only the thumbnail when the cover is removed', () => {
    expect(
      withCoverMedia(
        [
          {role: 'thumbnail', content: {ref: 'old'}},
          {role: 'gallery', content: {ref: 'other'}},
        ],
        null,
      ),
    ).toEqual([{role: 'gallery', content: {ref: 'other'}}])
    expect(withCoverMedia(undefined, null)).toEqual([])
  })

  it('writes the shape calendar apps read', () => {
    expect(coverMediaItem(cover)).toEqual({
      role: 'thumbnail',
      content: blob,
      aspect_ratio: {width: 600, height: 600},
    })
  })
})

it('counts a picked cover as content worth confirming before removal', () => {
  const base = {
    name: '',
    date: '2026-12-01',
    time: '12:00',
    timezone: 'UTC',
    mode: 'inperson' as const,
  }
  expect(eventHasContent(base)).toBe(false)
  expect(
    eventHasContent({
      ...base,
      cover: {path: 'x', mime: 'image/jpeg', width: 1, height: 1},
    }),
  ).toBe(true)
})

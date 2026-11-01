import {type Client} from '@atproto/lex'

import {com} from '#/lexicons'
import {isOfficialTennaFeed, readPreference, writePreference} from './records'

const uri =
  'at://did:web:vessel.darkworld.download/app.bsky.feed.generator/tennalings'
const did = 'did:web:tenna.party'

it('requires both the official owner and generator', () => {
  expect(isOfficialTennaFeed(uri, did)).toBe(true)
  expect(isOfficialTennaFeed(uri, 'did:web:other.example')).toBe(false)
  expect(
    isOfficialTennaFeed(
      uri.replace('vessel.darkworld.download', 'other.example'),
      did,
    ),
  ).toBe(false)
  expect(
    isOfficialTennaFeed(
      uri.replace('app.bsky.feed.generator', 'app.bsky.feed.post'),
      did,
    ),
  ).toBe(false)
})

it('preserves other preferences and uses a conditional write to the signed-in account', async () => {
  const call = jest
    .fn()
    .mockResolvedValueOnce({
      cid: 'existing-cid',
      value: {
        $type: 'party.tenna.feed.preference',
        showMarkedPosts: true,
      },
    })
    .mockResolvedValueOnce({})
  const client = {assertDid: 'did:plc:me', call} as unknown as Client
  await writePreference(client, uri, {optOut: true})
  expect(call).toHaveBeenLastCalledWith(com.atproto.repo.putRecord, {
    repo: 'did:plc:me',
    collection: 'party.tenna.feed.preference',
    rkey: 'tennalings',
    swapRecord: 'existing-cid',
    record: {
      $type: 'party.tenna.feed.preference',
      showMarkedPosts: true,
      optOut: true,
    },
  })
})

it('treats absent preferences as defaults but propagates network failures', async () => {
  const call = jest
    .fn()
    .mockRejectedValueOnce(new Error('Could not locate record: missing'))
    .mockRejectedValueOnce(new Error('offline'))
  const client = {assertDid: 'did:plc:me', call} as unknown as Client
  await expect(readPreference(client, uri)).resolves.toBeNull()
  await expect(readPreference(client, uri)).rejects.toThrow('offline')
})

it.each([true, false])('saves showMarkedPosts=%s without changing opt-out', async showMarkedPosts => {
  const call = jest.fn().mockResolvedValueOnce({
    cid: 'existing-cid',
    value: {$type: 'party.tenna.feed.preference', optOut: true, showMarkedPosts: !showMarkedPosts},
  }).mockResolvedValueOnce({})
  const client = {assertDid: 'did:plc:me', call} as unknown as Client
  await writePreference(client, uri, {showMarkedPosts})
  expect(call).toHaveBeenLastCalledWith(com.atproto.repo.putRecord, expect.objectContaining({
    swapRecord: 'existing-cid',
    record: {$type: 'party.tenna.feed.preference', optOut: true, showMarkedPosts},
  }))
})

it('creates an opt-in preference only if no record exists', async () => {
  const call = jest
    .fn()
    .mockRejectedValueOnce(new Error('Could not locate record: missing'))
    .mockResolvedValueOnce({})
  const client = {assertDid: 'did:plc:me', call} as unknown as Client
  await writePreference(client, uri, {optOut: false})
  expect(call).toHaveBeenLastCalledWith(
    com.atproto.repo.putRecord,
    expect.objectContaining({
      swapRecord: null,
      record: {
        $type: 'party.tenna.feed.preference',
        optOut: false,
      },
    }),
  )
})

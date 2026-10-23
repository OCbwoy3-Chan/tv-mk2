import {type Client} from '@atproto/lex'

import {device} from '#/storage'
import {CustomFeedAPI} from './custom'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

jest.mock('./utils', () => ({
  createBskyTopicsHeader: () => ({}),
  isBlueskyOwnedFeed: () => false,
}))

describe('CustomFeedAPI', () => {
  it('passes the abort signal to authenticated requests', async () => {
    const call = jest.fn().mockResolvedValue({feed: []})
    const client = {
      did: 'did:plc:test',
      call,
    } as unknown as Client
    const api = new CustomFeedAPI({
      client,
      feedParams: {
        feed: 'at://did:example:feed/app.bsky.feed.generator/test',
      },
    })
    const signal = new AbortController().signal

    await api.fetch({cursor: undefined, limit: 10, signal})

    expect(call).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({signal}),
    )
  })

  it('preserves the cursor from an empty logged-out fallback page', async () => {
    const originalFetch = global.fetch
    const fetchMock: jest.MockedFunction<typeof fetch> = jest
      .fn()
      .mockResolvedValueOnce(Response.json({feed: []}))
      .mockResolvedValueOnce(Response.json({feed: [], cursor: 'next'}))
    global.fetch = fetchMock
    const api = new CustomFeedAPI({
      client: {did: undefined} as unknown as Client,
      feedParams: {
        feed: 'at://did:example:feed/app.bsky.feed.generator/test',
      },
    })

    try {
      await expect(api.fetch({cursor: undefined, limit: 10})).resolves.toEqual({
        cursor: 'next',
        feed: [],
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      global.fetch = originalFetch
    }
  })
})

test('logged-out custom feeds follow app server changes', async () => {
  const previous = device.get(['customAppViewUrl'])
  const originalFetch = global.fetch
  const fetchMock = jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve(Response.json({feed: [], cursor: 'next'})),
    )
  global.fetch = fetchMock
  const api = new CustomFeedAPI({
    client: {did: undefined} as unknown as Client,
    feedParams: {feed: 'at://did:example:feed/app.bsky.feed.generator/test'},
  })
  try {
    for (const service of [
      'https://api.blacksky.community',
      'https://api.eurosky.network',
    ]) {
      device.set(['customAppViewUrl'], service)
      await api.fetch({cursor: undefined, limit: 10})
      const calls = fetchMock.mock.calls as unknown as [URL | string][]
      expect(new URL(calls[calls.length - 1][0]).origin).toBe(service)
    }
  } finally {
    device.set(['customAppViewUrl'], previous)
    global.fetch = originalFetch
  }
})

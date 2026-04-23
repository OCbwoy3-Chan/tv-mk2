import {beforeEach, describe, expect, it, jest} from '@jest/globals'

const mockResolveDid: jest.MockedFunction<
  (
    params: {did: string},
    options?: {signal?: AbortSignal},
  ) => Promise<{
    data: {
      didDoc: Record<string, unknown>
    }
  }>
> = jest.fn()
const mockDispose: jest.MockedFunction<() => void> = jest.fn()

jest.mock('#/state/session/agent', () => ({
  createPublicAgent() {
    return {
      com: {
        atproto: {
          identity: {
            resolveDid: mockResolveDid,
          },
        },
      },
      dispose: mockDispose,
    }
  },
}))

jest.mock('../direct-fetch-record', () => ({
  LRU: class<K, V> {
    private map = new Map<K, V>()

    async getOrTryInsertWith(key: K, factory: () => Promise<V>) {
      if (this.map.has(key)) {
        return this.map.get(key)
      }
      const value = await factory()
      this.map.set(key, value)
      return value
    }
  },
}))

import {resolveDidDocument} from '../resolve-identity'

describe('query DID resolution', () => {
  beforeEach(() => {
    mockResolveDid.mockReset()
    mockDispose.mockReset()
    jest.restoreAllMocks()
  })

  it('resolves did:web paths using the correct did.json URL', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'did:web:alice.example:users:bob',
          service: [],
        }),
    } as Response)

    await expect(
      resolveDidDocument('did:web:alice.example:users:bob'),
    ).resolves.toEqual({
      id: 'did:web:alice.example:users:bob',
      service: [],
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://alice.example/users/bob/did.json',
      {
        headers: {
          accept: 'application/did+ld+json, application/json',
        },
      },
    )
  })

  it('falls back to appview DID resolution when direct did:web fetching fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('CORS'))
    mockResolveDid.mockResolvedValueOnce({
      data: {
        didDoc: {
          id: 'did:web:alice.example',
          service: [],
        },
      },
    })

    await expect(resolveDidDocument('did:web:alice.example')).resolves.toEqual({
      id: 'did:web:alice.example',
      service: [],
    })

    expect(mockResolveDid).toHaveBeenCalledWith({did: 'did:web:alice.example'})
    expect(mockDispose).toHaveBeenCalled()
  })
})

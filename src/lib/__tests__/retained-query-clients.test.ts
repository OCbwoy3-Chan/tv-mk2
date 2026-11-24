import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {
  discardAllRetainedQueryClients,
  discardRetainedQueryClient,
  getRetainedQueryClient,
  holdRetainedQueryClient,
} from '#/lib/retained-query-clients'

function value() {
  return {retire: jest.fn(), dispose: jest.fn()}
}

beforeEach(() => {
  discardAllRetainedQueryClients()
})

describe('retained query clients', () => {
  it('returns the same client for the same account', () => {
    const first = getRetainedQueryClient('did:plc:alice', value)
    expect(getRetainedQueryClient('did:plc:alice', value)).toBe(first)
  })

  it('starts fresh after an account is discarded', () => {
    const first = getRetainedQueryClient('did:plc:alice', value)
    discardRetainedQueryClient('did:plc:alice')
    expect(getRetainedQueryClient('did:plc:alice', value)).not.toBe(first)
  })

  it('drops and disposes the least recently used client past the cap', () => {
    const oldest = getRetainedQueryClient('a', value)
    const recent = getRetainedQueryClient('b', value)
    for (const key of ['c', 'd', 'e']) getRetainedQueryClient(key, value)
    // Touch b so a is the least recently used.
    getRetainedQueryClient('b', value)
    getRetainedQueryClient('f', value)

    expect(oldest.dispose).toHaveBeenCalled()
    expect(getRetainedQueryClient('b', value)).toBe(recent)
    expect(getRetainedQueryClient('a', value)).not.toBe(oldest)
  })

  it('retires a mounted client at once but disposes it on unmount', () => {
    const client = getRetainedQueryClient('did:plc:alice', value)
    const release = holdRetainedQueryClient(client)
    discardRetainedQueryClient('did:plc:alice')

    expect(client.retire).toHaveBeenCalled()
    expect(client.dispose).not.toHaveBeenCalled()
    release()
    expect(client.dispose).toHaveBeenCalled()
  })

  it('can keep one client when discarding all', () => {
    const kept = getRetainedQueryClient('a', value)
    const dropped = getRetainedQueryClient('b', value)
    discardAllRetainedQueryClients({except: 'a'})

    expect(kept.retire).not.toHaveBeenCalled()
    expect(dropped.retire).toHaveBeenCalled()
    expect(getRetainedQueryClient('a', value)).toBe(kept)
  })
})

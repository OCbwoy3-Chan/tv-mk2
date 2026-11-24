import {describe, expect, it, jest} from '@jest/globals'

import {fetchProfileBatched} from '#/state/queries/profile-batch'
import {app} from '#/lexicons'

type Params = {actors: string[]; actor: string}
type Call = (method: unknown, params: Params) => Promise<unknown>

function makeClient(respond?: (actors: string[]) => Promise<unknown>) {
  const call = jest.fn<Call>((_method, {actors}) =>
    respond
      ? respond(actors)
      : Promise.resolve({
          profiles: actors.map(did => ({did, handle: `${did}.test`})),
        }),
  )
  return {client: {call} as never, call}
}

describe('fetchProfileBatched', () => {
  it('coalesces lookups into one request, deduplicating dids', async () => {
    const {client, call} = makeClient()
    const results = await Promise.all([
      fetchProfileBatched(client, 'did:plc:a'),
      fetchProfileBatched(client, 'did:plc:b'),
      fetchProfileBatched(client, 'did:plc:a'),
    ])

    expect(call).toHaveBeenCalledTimes(1)
    expect(call.mock.calls[0][1].actors).toEqual(['did:plc:a', 'did:plc:b'])
    expect(results.map(p => p.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
      'did:plc:a',
    ])
  })

  it('splits large batches into getProfiles-sized requests', async () => {
    const {client, call} = makeClient()
    const dids = Array.from({length: 30}, (_, i) => `did:plc:${i}`)
    await Promise.all(dids.map(did => fetchProfileBatched(client, did)))

    expect(call).toHaveBeenCalledTimes(2)
    expect(call.mock.calls[0][1].actors).toHaveLength(25)
    expect(call.mock.calls[1][1].actors).toHaveLength(5)
  })

  it('keeps separate clients in separate requests', async () => {
    const first = makeClient()
    const second = makeClient()
    await Promise.all([
      fetchProfileBatched(first.client, 'did:plc:a'),
      fetchProfileBatched(second.client, 'did:plc:a'),
    ])

    expect(first.call).toHaveBeenCalledTimes(1)
    expect(second.call).toHaveBeenCalledTimes(1)
  })

  it('falls back to getProfile for actors missing from the response', async () => {
    const call = jest.fn<Call>((method, params) => {
      if (method === app.bsky.actor.getProfiles) {
        return Promise.resolve({profiles: []})
      }
      return Promise.reject(new Error(`AccountDeactivated: ${params.actor}`))
    })

    await expect(
      fetchProfileBatched({call} as never, 'did:plc:gone'),
    ).rejects.toThrow('AccountDeactivated: did:plc:gone')
  })

  it('isolates a rejected batch to the actors that fail on their own', async () => {
    const call = jest.fn<Call>((method, params) => {
      if (method === app.bsky.actor.getProfiles) {
        return Promise.reject(new Error('InvalidRequest'))
      }
      const actor = params.actor
      return actor === 'did:plc:bad'
        ? Promise.reject(new Error('InvalidRequest'))
        : Promise.resolve({did: actor, handle: 'ok.test'})
    })
    const client = {call} as never

    const [good, bad] = await Promise.allSettled([
      fetchProfileBatched(client, 'did:plc:good'),
      fetchProfileBatched(client, 'did:plc:bad'),
    ])
    expect(good.status).toBe('fulfilled')
    expect(bad.status).toBe('rejected')
  })

  it('rejects every waiter when offline', async () => {
    const {client} = makeClient(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    )

    const results = await Promise.allSettled([
      fetchProfileBatched(client, 'did:plc:a'),
      fetchProfileBatched(client, 'did:plc:b'),
    ])
    expect(results.map(r => r.status)).toEqual(['rejected', 'rejected'])
  })
})

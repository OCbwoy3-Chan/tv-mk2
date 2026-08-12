import {describe, expect, it, jest} from '@jest/globals'

import {createPdsViewabilityStore} from '#/state/pds-viewability'

describe(`PDS profile priority`, () => {
  it(`promotes a profile from off to near to visible without downgrading`, () => {
    const store = createPdsViewabilityStore()
    const listener = jest.fn()
    store.subscribe(`did:plc:alice`, listener)

    expect(store.getPriority(`did:plc:alice`)).toBe(`off`)

    store.markNearViewport([`did:plc:alice`])
    expect(store.getPriority(`did:plc:alice`)).toBe(`near`)
    expect(listener).toHaveBeenCalledTimes(1)

    store.markNearViewport([`did:plc:alice`])
    expect(listener).toHaveBeenCalledTimes(1)

    store.markVisible([`did:plc:alice`])
    expect(store.getPriority(`did:plc:alice`)).toBe(`visible`)
    expect(listener).toHaveBeenCalledTimes(2)

    store.markNearViewport([`did:plc:alice`])
    expect(store.getPriority(`did:plc:alice`)).toBe(`visible`)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it(`updates only subscribers for the promoted DID`, () => {
    const store = createPdsViewabilityStore()
    const aliceListener = jest.fn()
    const bobListener = jest.fn()
    const unsubscribeAlice = store.subscribe(`did:plc:alice`, aliceListener)
    store.subscribe(`did:plc:bob`, bobListener)

    unsubscribeAlice()
    store.markVisible([`did:plc:alice`, `did:plc:bob`])

    expect(aliceListener).not.toHaveBeenCalled()
    expect(bobListener).toHaveBeenCalledTimes(1)
  })
})

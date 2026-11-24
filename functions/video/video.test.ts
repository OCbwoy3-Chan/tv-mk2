import {onRequestGet, parseRange} from './[did]/[cid]'

describe('parseRange', () => {
  it('reads an explicit span', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual([0, 99])
  })

  it('clamps the end to the file size', () => {
    expect(parseRange('bytes=900-2000', 1000)).toEqual([900, 999])
  })

  it('runs an open span to the end of the file', () => {
    expect(parseRange('bytes=500-', 1000)).toEqual([500, 999])
  })

  it('reads a suffix span', () => {
    expect(parseRange('bytes=-100', 1000)).toEqual([900, 999])
  })

  it('rejects a span starting past the end', () => {
    expect(parseRange('bytes=1000-', 1000)).toBeNull()
  })

  it('rejects an inverted span', () => {
    expect(parseRange('bytes=999-998', 1000)).toBeNull()
  })

  it('rejects an empty suffix span', () => {
    expect(parseRange('bytes=-0', 1000)).toBeNull()
  })

  it('ignores a header it does not understand', () => {
    expect(parseRange('bytes=abc', 1000)).toBeUndefined()
    expect(parseRange('items=0-1', 1000)).toBeUndefined()
  })
})

describe('video proxy', () => {
  it('rejects a malformed DID without calling the network', async () => {
    const context = {
      params: {did: 'nope', cid: 'bafy'},
      request: new Request('https://x/video/nope/bafy'),
    } as unknown as Parameters<typeof onRequestGet>[0]

    const response = await onRequestGet(context)
    expect(response.status).toBe(404)
  })

  it('rejects a malformed CID without calling the network', async () => {
    const context = {
      params: {did: 'did:plc:alice', cid: '../secret'},
      request: new Request('https://x/video/did:plc:alice/../secret'),
    } as unknown as Parameters<typeof onRequestGet>[0]

    const response = await onRequestGet(context)
    expect(response.status).toBe(404)
  })
})

import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {hasWorkingHandleLink} from '#/state/queries/handle-link'

describe('handle link DNS checks', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns true when any DNS record type resolves', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({Answer: []}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Answer: [{data: '2606:4700:4700::1111'}],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({Answer: []}),
      } as Response)

    await expect(hasWorkingHandleLink('alice.example')).resolves.toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    const urls = fetchSpy.mock.calls.map(([url]) => {
      if (url instanceof URL) return url.toString()
      if (typeof url === 'string') return url
      return url.url
    })
    expect(urls.every(url => url.includes('name=alice.example'))).toBe(true)
    expect(urls).toContainEqual(expect.stringContaining('type=A'))
    expect(urls).toContainEqual(expect.stringContaining('type=AAAA'))
    expect(urls).toContainEqual(expect.stringContaining('type=CNAME'))
  })

  it('returns false when no DNS record type resolves', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({Answer: []}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)

    await expect(hasWorkingHandleLink('alice.example')).resolves.toBe(false)
  })

  it('supports native abort signals without throwIfAborted', async () => {
    const controller = new AbortController()
    Object.defineProperty(controller.signal, 'throwIfAborted', {value: undefined})
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({Answer: [{data: '192.0.2.1'}]}),
    } as Response)

    await expect(
      hasWorkingHandleLink('alice.example', controller.signal),
    ).resolves.toBe(true)
  })

  it('rejects cancelled native DNS checks', async () => {
    const controller = new AbortController()
    Object.defineProperty(controller.signal, 'throwIfAborted', {value: undefined})
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Cancelled'))
    controller.abort()

    await expect(
      hasWorkingHandleLink('alice.example', controller.signal),
    ).rejects.toMatchObject({name: 'AbortError'})
  })
})

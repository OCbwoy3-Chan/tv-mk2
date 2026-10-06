import {act, renderHook} from '@testing-library/react-native'

import {useRichText as useLegacyRichText} from '#/lib/hooks/useRichText'
import {useAppviewClient} from '#/state/session'
import {useRichText} from '#/components/hooks/useRichText'

jest.mock('#/state/session', () => ({useAppviewClient: jest.fn()}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return {promise, resolve, reject}
}

const call = jest.fn<Promise<{did: string}>, [unknown, {handle: string}]>()

beforeEach(() => {
  call.mockReset()
  jest.mocked(useAppviewClient).mockReturnValue({call} as never)
})

test.each(['', 'A plain bio', 'Visit https://example.com #hello'])(
  'text without mentions is ready on the first render: %s',
  async text => {
    const {result} = renderHook(() => useRichText(text))

    expect(result.current[0].text).toBe(text)
    expect(result.current[1]).toBe(false)
    expect(call).not.toHaveBeenCalled()
    await act(async () => {})
  },
)

test('links and tags are available while a mention lookup is pending', async () => {
  const lookup = deferred<{did: string}>()
  call.mockReturnValue(lookup.promise)
  const text = '🌈 @alice.test https://example.com #hello'
  const {result} = renderHook(() => useLegacyRichText(text))
  const initialRT = result.current[0]
  const segments = Array.from(initialRT.segments())

  expect(initialRT.text).toBe(text)
  expect(result.current[1]).toBe(true)
  expect(segments.find(segment => segment.link)?.link?.uri).toBe(
    'https://example.com',
  )
  expect(segments.find(segment => segment.tag)?.tag?.tag).toBe('hello')
  expect(call).toHaveBeenCalledTimes(1)
  expect(call.mock.calls[0][1]).toEqual({handle: 'alice.test'})

  await act(async () => {
    lookup.resolve({did: 'did:plc:alice'})
    await lookup.promise
  })

  expect(result.current[1]).toBe(false)
  expect(
    Array.from(result.current[0].segments()).find(segment => segment.mention)
      ?.mention?.did,
  ).toBe('did:plc:alice')
  expect(
    Array.from(initialRT.segments()).find(segment => segment.mention)?.mention
      ?.did,
  ).toBe('alice.test')
})

test('a failed mention lookup leaves the bio readable and finishes resolving', async () => {
  const lookup = deferred<{did: string}>()
  call.mockReturnValue(lookup.promise)
  const text = '@alice.test https://example.com'
  const {result} = renderHook(() => useRichText(text))

  await act(async () => {
    lookup.reject(new Error('Offline'))
    await lookup.promise.catch(() => {})
  })

  expect(result.current[0].text).toBe(text)
  expect(result.current[1]).toBe(false)
  expect(
    Array.from(result.current[0].segments()).find(segment => segment.link)?.link
      ?.uri,
  ).toBe('https://example.com')
  expect(
    Array.from(result.current[0].segments()).find(segment => segment.mention)
      ?.mention?.did,
  ).toBe('')
})

test('a previous bio lookup cannot replace the current bio', async () => {
  const alice = deferred<{did: string}>()
  const bob = deferred<{did: string}>()
  call.mockReturnValueOnce(alice.promise).mockReturnValueOnce(bob.promise)
  const {result, rerender} = renderHook(
    ({text}: {text: string}) => useRichText(text),
    {initialProps: {text: '@alice.test'}},
  )

  rerender({text: '@bob.test https://example.org'})
  expect(result.current[0].text).toBe('@bob.test https://example.org')
  expect(result.current[1]).toBe(true)

  await act(async () => {
    bob.resolve({did: 'did:plc:bob'})
    await bob.promise
  })
  const currentRT = result.current[0]
  await act(async () => {
    alice.resolve({did: 'did:plc:alice'})
    await alice.promise
  })

  expect(result.current[0]).toBe(currentRT)
  expect(result.current[1]).toBe(false)
  expect(
    Array.from(currentRT.segments()).find(segment => segment.mention)?.mention
      ?.did,
  ).toBe('did:plc:bob')
})

test('changing app servers clears resolved mentions and ignores the previous lookup', async () => {
  const first = deferred<{did: string}>()
  call.mockReturnValue(first.promise)
  const {result, rerender} = renderHook(() => useRichText('@alice.test'))

  const next = deferred<{did: string}>()
  const nextCall = jest.fn().mockReturnValue(next.promise)
  jest.mocked(useAppviewClient).mockReturnValue({call: nextCall} as never)
  rerender({})

  await act(async () => {
    first.resolve({did: 'did:plc:old'})
    await first.promise
  })
  expect(result.current[1]).toBe(true)

  await act(async () => {
    next.resolve({did: 'did:plc:new'})
    await next.promise
  })
  expect(result.current[1]).toBe(false)
  expect(
    Array.from(result.current[0].segments()).find(segment => segment.mention)
      ?.mention?.did,
  ).toBe('did:plc:new')

  const third = deferred<{did: string}>()
  jest.mocked(useAppviewClient).mockReturnValue({
    call: jest.fn().mockReturnValue(third.promise),
  } as never)
  rerender({})
  expect(result.current[1]).toBe(true)
  expect(
    Array.from(result.current[0].segments()).find(segment => segment.mention)
      ?.mention?.did,
  ).toBe('alice.test')
  await act(async () => {
    third.resolve({did: 'did:plc:third'})
    await third.promise
  })
})

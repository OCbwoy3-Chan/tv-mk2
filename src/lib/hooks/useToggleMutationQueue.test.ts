import {act, renderHook} from '@testing-library/react-native'

import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return {promise, resolve, reject}
}

test('undo and bump use the confirmed repost URI before a rerender', async () => {
  let nextRepost = 0
  const runMutation = jest.fn((_prev: string | undefined, isOn: boolean) =>
    Promise.resolve(isOn ? `repost-${++nextRepost}` : undefined),
  )
  const onSuccess = jest.fn()
  const {result} = renderHook(() =>
    useToggleMutationQueue<string | undefined>({
      initialState: undefined,
      runMutation,
      onSuccess,
    }),
  )

  await act(async () => {
    await result.current(true)
    await result.current(false)
    await result.current(true)
    await result.current(false)
    await result.current(true)
  })

  expect(runMutation.mock.calls).toEqual([
    [undefined, true],
    ['repost-1', false],
    [undefined, true],
    ['repost-2', false],
    [undefined, true],
  ])
  expect(onSuccess).toHaveBeenLastCalledWith('repost-3')
})

test('duplicate queued requests settle without creating another repost', async () => {
  const request = deferred<string>()
  const runMutation = jest.fn(() => request.promise)
  const {result} = renderHook(() =>
    useToggleMutationQueue<string | undefined>({
      initialState: undefined,
      runMutation,
      onSuccess: jest.fn(),
    }),
  )

  await act(async () => {
    const first = result.current(true)
    const second = result.current(true)
    request.resolve('repost-1')
    await expect(first).resolves.toBe('repost-1')
    await expect(second).resolves.toBe('repost-1')
  })
  expect(runMutation).toHaveBeenCalledTimes(1)
})

test('a queued retry runs after the preceding request fails', async () => {
  const request = deferred<string>()
  const runMutation = jest
    .fn()
    .mockImplementationOnce(() => request.promise)
    .mockResolvedValueOnce('repost-1')
  const {result} = renderHook(() =>
    useToggleMutationQueue<string | undefined>({
      initialState: undefined,
      runMutation,
      onSuccess: jest.fn(),
    }),
  )

  await act(async () => {
    const first = result.current(true).catch(error => error)
    const retry = result.current(true)
    const error = new Error('Network failure')
    request.reject(error)
    expect(await first).toBe(error)
    await expect(retry).resolves.toBe('repost-1')
  })
  expect(runMutation).toHaveBeenCalledTimes(2)
})

test('an undo queued during creation deletes the new repost', async () => {
  const request = deferred<string>()
  const runMutation = jest
    .fn()
    .mockImplementationOnce(() => request.promise)
    .mockResolvedValueOnce(undefined)
  const onSuccess = jest.fn()
  const {result, rerender} = renderHook(
    ({initialState}: {initialState: string | undefined}) =>
      useToggleMutationQueue({initialState, runMutation, onSuccess}),
    {initialProps: {initialState: undefined as string | undefined}},
  )

  let create!: Promise<string | undefined>
  let undo!: Promise<string | undefined>
  act(() => {
    create = result.current(true)
  })
  rerender({initialState: 'pending'})
  act(() => {
    undo = result.current(false)
  })
  await act(async () => {
    request.resolve('repost-1')
    await create
    await undo
  })

  expect(runMutation).toHaveBeenLastCalledWith('repost-1', false)
  expect(onSuccess).toHaveBeenLastCalledWith(undefined)
})

test('a failed bump creation leaves the confirmed state unreposted', async () => {
  const error = new Error('Network failure')
  const runMutation = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(error)
  const onSuccess = jest.fn()
  const {result} = renderHook(() =>
    useToggleMutationQueue<string | undefined>({
      initialState: 'repost-1',
      runMutation,
      onSuccess,
    }),
  )

  await act(async () => {
    await result.current(false)
    await expect(result.current(true)).rejects.toBe(error)
  })
  expect(runMutation).toHaveBeenLastCalledWith(undefined, true)
  expect(onSuccess).toHaveBeenLastCalledWith(undefined)
})

test('idle queues accept refreshed server state', async () => {
  const runMutation = jest.fn().mockResolvedValue(undefined)
  const {result, rerender} = renderHook(
    ({initialState}: {initialState: string | undefined}) =>
      useToggleMutationQueue({
        initialState,
        runMutation,
        onSuccess: jest.fn(),
      }),
    {initialProps: {initialState: undefined as string | undefined}},
  )
  rerender({initialState: 'refreshed-repost'})

  await act(async () => {
    await result.current(false)
  })
  expect(runMutation).toHaveBeenCalledWith('refreshed-repost', false)
})

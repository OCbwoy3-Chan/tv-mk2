import {InfiniteQueryObserver, QueryClient} from '@tanstack/react-query'

import {
  createCursorPagination,
  pageNumber,
  unwrapCursor,
} from '#/state/queries/cursor-pagination'

type Cursor = {cursor: string; fallback?: boolean} | undefined
type Page = {cursor?: Cursor; items: number[]}

function setup(enabled = true) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  let fail = false
  const calls: Cursor[] = []
  const observer = new InfiniteQueryObserver(client, {
    queryKey: ['results', enabled],
    ...createCursorPagination<Page, Cursor>(
      enabled,
      page => page.cursor,
      undefined,
    ),
    queryFn: ({pageParam}) => {
      if (fail) throw new Error('offline')
      const cursor = unwrapCursor(pageParam)
      calls.push(cursor)
      const page = Number(cursor?.cursor ?? 1)
      return {
        items: page === 2 ? [] : [page],
        cursor:
          page < 100 ? {cursor: String(page + 1), fallback: true} : undefined,
      }
    },
  })
  const unsubscribe = observer.subscribe(() => {})
  return {
    client,
    observer,
    calls,
    setFail: (value: boolean) => {
      fail = value
    },
    cleanup: () => {
      unsubscribe()
      client.clear()
    },
  }
}

test('one hundred pages retain one result page and preserve compound server cursors', async () => {
  const {observer, calls, cleanup} = setup()
  try {
    await observer.refetch()
    for (let index = 2; index <= 100; index++) {
      const result = await observer.fetchNextPage()
      expect(result.data?.pages).toHaveLength(1)
      expect(pageNumber(result.data?.pageParams[0])).toBe(index)
      expect(calls.at(-1)).toEqual({cursor: String(index), fallback: true})
    }
    expect(observer.getCurrentResult().hasNextPage).toBe(false)
    expect(observer.getCurrentResult().hasPreviousPage).toBe(true)
    const previous = await observer.fetchPreviousPage()
    expect(previous.data?.pages[0].items).toEqual([99])
  } finally {
    cleanup()
  }
})

test('empty pages remain navigable and previous can return to the first page', async () => {
  const {observer, cleanup} = setup()
  try {
    await observer.refetch()
    const empty = await observer.fetchNextPage()
    expect(empty.data?.pages[0].items).toEqual([])
    expect(empty.hasNextPage).toBe(true)
    expect(empty.hasPreviousPage).toBe(true)
    const first = await observer.fetchPreviousPage()
    expect(first.data?.pages[0].items).toEqual([1])
    expect(first.hasPreviousPage).toBe(false)
  } finally {
    cleanup()
  }
})

test('failed backward navigation retains the current results and can retry', async () => {
  const {observer, setFail, cleanup} = setup()
  try {
    await observer.refetch()
    await observer.fetchNextPage()
    await observer.fetchNextPage()
    setFail(true)
    const result = await observer.fetchPreviousPage()
    expect(result.isFetchPreviousPageError).toBe(true)
    expect(result.data?.pages[0].items).toEqual([3])
    setFail(false)
    expect(
      pageNumber((await observer.fetchPreviousPage()).data?.pageParams[0]),
    ).toBe(2)
  } finally {
    cleanup()
  }
})

test('refresh resets deep pagination and refreshes the first page in place', async () => {
  const {client, observer, cleanup} = setup()
  try {
    await observer.refetch()
    await observer.fetchNextPage()
    await client.resetQueries({queryKey: ['results', true], exact: true})
    expect(observer.getCurrentResult().data?.pages[0].items).toEqual([1])
    expect(observer.getCurrentResult().hasPreviousPage).toBe(false)
    const before = observer.getCurrentResult().data
    const refresh = observer.refetch()
    expect(observer.getCurrentResult().data).toBe(before)
    await refresh
  } finally {
    cleanup()
  }
})

test('disabled pagination retains the original cursor shape and accumulates results', async () => {
  const {observer, cleanup} = setup(false)
  try {
    await observer.refetch()
    const result = await observer.fetchNextPage()
    expect(result.data?.pages).toHaveLength(2)
    expect(result.data?.pageParams).toEqual([
      undefined,
      {cursor: '2', fallback: true},
    ])
    expect(result.hasPreviousPage).toBe(false)
  } finally {
    cleanup()
  }
})

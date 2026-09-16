import {InfiniteQueryObserver, QueryClient} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'
import {
  type FeedPageUnselected,
  type RQPageParam,
} from '#/state/queries/post-feed'
import {getPostFeedPaginationOptions} from '#/state/queries/post-feed-pagination'
import {refreshPostFeedQueries} from '#/state/queries/refresh-post-feed'

function setup(paginated = true) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  const api = {} as FeedAPI
  let fail = false
  const observer = new InfiniteQueryObserver(client, {
    queryKey: ['post-feed', 'following', {paginated}],
    ...getPostFeedPaginationOptions(paginated),
    initialPageParam: undefined as RQPageParam,
    queryFn: ({pageParam}): FeedPageUnselected => {
      if (fail) throw new Error('offline')
      const page = pageParam?.page ?? 1
      return {api, page, cursor: String(page), feed: [], fetchedAt: page}
    },
  })
  const unsubscribe = observer.subscribe(() => {})
  return {
    client,
    observer,
    setFail: (value: boolean) => {
      fail = value
    },
    cleanup: () => {
      unsubscribe()
      client.clear()
    },
  }
}

test('deep pagination retains only one page and its continuation cursor', async () => {
  const {client, observer, cleanup} = setup()
  try {
    await observer.refetch()
    for (let page = 2; page <= 100; page++) {
      const result = await observer.fetchNextPage()
      expect(result.data?.pages.map(p => p.page)).toEqual([page])
      expect(result.data?.pageParams).toHaveLength(1)
      expect((result.data?.pageParams[0] as RQPageParam)?.cursor).toBe(
        String(page - 1),
      )
    }
    await client.resetQueries({queryKey: ['post-feed', 'following']})
    expect(observer.getCurrentResult().data?.pages.map(p => p.page)).toEqual([
      1,
    ])
    expect(observer.getCurrentResult().data?.pageParams).toEqual([undefined])
  } finally {
    cleanup()
  }
})

test('a failed next page preserves the current page and retries the same cursor', async () => {
  const {observer, setFail, cleanup} = setup()
  try {
    await observer.refetch()
    setFail(true)
    const failed = await observer.fetchNextPage()
    expect(failed.isFetchNextPageError).toBe(true)
    expect(failed.data?.pages.map(p => p.page)).toEqual([1])
    setFail(false)
    const retried = await observer.fetchNextPage()
    expect(retried.data?.pages.map(p => p.page)).toEqual([2])
  } finally {
    cleanup()
  }
})

test('infinite scrolling continues to accumulate pages', async () => {
  const {observer, cleanup} = setup(false)
  try {
    await observer.refetch()
    await observer.fetchNextPage()
    const result = await observer.fetchNextPage()
    expect(result.data?.pages.map(p => p.page)).toEqual([1, 2, 3])
  } finally {
    cleanup()
  }
})

test('previous page replaces the current page and can advance again', async () => {
  const {observer, cleanup} = setup()
  try {
    await observer.refetch()
    await observer.fetchNextPage()
    await observer.fetchNextPage()
    const previous = await observer.fetchPreviousPage()
    expect(previous.data?.pages.map(p => p.page)).toEqual([2])
    expect(previous.data?.pageParams).toHaveLength(1)
    const first = await observer.fetchPreviousPage()
    expect(first.data?.pages.map(p => p.page)).toEqual([1])
    expect(first.hasPreviousPage).toBe(false)
    const next = await observer.fetchNextPage()
    expect(next.data?.pages.map(p => p.page)).toEqual([2])
  } finally {
    cleanup()
  }
})

test('a failed previous page retains the current page for retry', async () => {
  const {observer, setFail, cleanup} = setup()
  try {
    await observer.refetch()
    await observer.fetchNextPage()
    setFail(true)
    const failed = await observer.fetchPreviousPage()
    expect(failed.isFetchPreviousPageError).toBe(true)
    expect(failed.data?.pages.map(p => p.page)).toEqual([2])
    setFail(false)
    const retried = await observer.fetchPreviousPage()
    expect(retried.data?.pages.map(p => p.page)).toEqual([1])
  } finally {
    cleanup()
  }
})

test.each([true, false])(
  'refresh shortcuts return to page one (paginated=%s)',
  async paginated => {
    const {client, observer, cleanup} = setup(paginated)
    try {
      await observer.refetch()
      await observer.fetchNextPage()
      await observer.fetchNextPage()
      await refreshPostFeedQueries(client, ['post-feed', 'following'])
      expect(observer.getCurrentResult().data?.pages.map(p => p.page)).toEqual([
        1,
      ])
      expect(observer.getCurrentResult().data?.pageParams).toEqual([undefined])
      expect(observer.getCurrentResult().hasPreviousPage).toBe(false)
    } finally {
      cleanup()
    }
  },
)

test('refreshing page one keeps its posts visible throughout the request', async () => {
  const {client, observer, cleanup} = setup()
  try {
    await observer.refetch()
    const states: {pending: boolean; pages: number[] | undefined}[] = []
    const unsubscribe = observer.subscribe(result => {
      states.push({
        pending: result.isPending,
        pages: result.data?.pages.map(page => page.page),
      })
    })
    await refreshPostFeedQueries(client, ['post-feed', 'following'])
    unsubscribe()
    expect(states.length).toBeGreaterThan(0)
    expect(
      states.every(state => !state.pending && state.pages?.[0] === 1),
    ).toBe(true)
  } finally {
    cleanup()
  }
})

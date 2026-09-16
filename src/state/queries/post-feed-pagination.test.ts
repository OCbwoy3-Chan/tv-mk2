import {InfiniteQueryObserver, QueryClient} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'
import {
  type FeedPageUnselected,
  type RQPageParam,
} from '#/state/queries/post-feed'
import {getPostFeedPaginationOptions} from '#/state/queries/post-feed-pagination'

function setup(paginated = true) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  const api = {} as FeedAPI
  let fail = false
  const observer = new InfiniteQueryObserver(client, {
    queryKey: ['pagination-test'],
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
    await client.resetQueries({queryKey: ['pagination-test']})
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

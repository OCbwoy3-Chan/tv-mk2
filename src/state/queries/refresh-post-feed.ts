import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'

/** Return paginated feeds to page one; retain normal infinite-feed refresh. */
export async function refreshPostFeedQueries(
  client: QueryClient,
  queryKey: QueryKey,
) {
  await Promise.all(
    client
      .getQueryCache()
      .findAll({queryKey})
      .map(query => {
        const params = query.queryKey[2] as {paginated?: boolean} | undefined
        const data = query.state.data as
          InfiniteData<{page?: number}> | undefined
        if (params?.paginated && (data?.pages[0]?.page ?? 1) > 1) {
          return client.resetQueries({queryKey: query.queryKey, exact: true})
        }
        client.setQueryData<InfiniteData<unknown>>(
          query.queryKey,
          data =>
            data && {
              pages: data.pages.slice(0, 1),
              pageParams: data.pageParams.slice(0, 1),
            },
        )
        return client.invalidateQueries({queryKey: query.queryKey, exact: true})
      }),
  )
}

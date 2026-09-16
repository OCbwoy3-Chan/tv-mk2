import {
  type FeedPageUnselected,
  type RQPageParam,
} from '#/state/queries/post-feed'

/** Evict old post data while retaining the cursor needed to keep going. */
export function getPostFeedPaginationOptions(paginated: boolean) {
  return {
    maxPages: paginated ? 1 : undefined,
    gcTime: paginated ? 0 : undefined,
    getPreviousPageParam(firstPage: FeedPageUnselected): RQPageParam {
      return paginated && firstPage.page > 1
        ? {
            api: firstPage.api,
            cursor: String(firstPage.page - 2),
            page: firstPage.page - 1,
          }
        : undefined
    },
    getNextPageParam(lastPage: FeedPageUnselected): RQPageParam {
      return lastPage.cursor
        ? {
            api: lastPage.api,
            cursor: lastPage.cursor,
            page: (lastPage.page ?? 1) + 1,
          }
        : undefined
    },
  }
}

import {
  type FeedPageUnselected,
  type RQPageParam,
} from '#/state/queries/post-feed'

/** Evict old post data while retaining the cursor needed to keep going. */
export function getPostFeedPaginationOptions(paginated: boolean) {
  return {
    maxPages: paginated ? 1 : undefined,
    gcTime: paginated ? 0 : undefined,
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

import {
  type InfiniteData,
  keepPreviousData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {
  type CursorPageParam,
  unwrapCursor,
  useCursorPagination,
} from '#/state/queries/cursor-pagination'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const RQKEY_ROOT = 'starter-pack-search'
export const RQKEY = (query: string, limit?: number) => [
  RQKEY_ROOT,
  query,
  limit,
]

export function useStarterPackSearch({
  query,
  enabled,
  maintainData,
  limit = 25,
  paginated = false,
}: {
  query: string
  enabled?: boolean
  maintainData?: boolean
  limit?: number
  paginated?: boolean
}) {
  const client = useAppviewClient()
  const pagination = useCursorPagination<
    app.bsky.graph.searchStarterPacksV2.$OutputBody,
    string | undefined
  >(RQKEY(query, limit), paginated, page => page.cursor, undefined)
  const result = useInfiniteQuery<
    app.bsky.graph.searchStarterPacksV2.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.searchStarterPacksV2.$OutputBody>,
    QueryKey,
    CursorPageParam<string | undefined>
  >({
    staleTime: STALE.MINUTES.FIVE,
    ...pagination,
    queryFn: async ({pageParam}) => {
      return await client.call(app.bsky.graph.searchStarterPacksV2, {
        q: query,
        limit,
        cursor: unwrapCursor(pageParam),
      })
    },
    enabled: enabled && !!query,
    placeholderData: maintainData ? keepPreviousData : undefined,
    select,
  })
  return {...result, paginationQueryKey: pagination.queryKey}
}

function select(
  data: InfiniteData<app.bsky.graph.searchStarterPacksV2.$OutputBody>,
) {
  // enforce uniqueness
  const uris = new Set()

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      starterPacks: page.starterPacks.filter(starterPack => {
        if (uris.has(starterPack.uri)) {
          return false
        }
        uris.add(starterPack.uri)
        return true
      }),
    })),
  }
}

import {type AppBskyFeedDefs, AtUri} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {precachePost} from '#/state/queries/post'
import {useAgent} from '#/state/session'
import {embedViewRecordToPostView, getEmbeddedPost} from './util'

const ALSO_LIKED_URL = 'https://foryou.club/also-liked'
const ALSO_LIKED_PAGE_SIZE = 10

type AlsoLikedSkeletonResponse = {
  cursor?: string
  feed?: Array<{post?: string}>
}

type AlsoLikedPage = {
  cursor?: string
  posts: AppBskyFeedDefs.PostView[]
}

async function fetchAlsoLikedSkeleton(
  postUri: string,
  pageParam: string | undefined,
) {
  try {
    const res = await fetch(getAlsoLikedUrl(postUri, pageParam).toString())
    if (!res.ok) {
      throw new Error(
        `Failed to load also liked recommendations (${res.status})`,
      )
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const body = await res.text()
      throw new Error(
        body.startsWith('<!DOCTYPE') || body.startsWith('<!doctype')
          ? 'Also liked is unavailable from this web environment right now.'
          : 'Also liked returned an unexpected response.',
      )
    }

    return (await res.json()) as AlsoLikedSkeletonResponse
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}

function getAlsoLikedUrl(postUri: string, pageParam: string | undefined) {
  const url = new URL(ALSO_LIKED_URL)
  url.searchParams.set('format', 'json')
  url.searchParams.set('post', postUri)
  url.searchParams.set('limit', String(ALSO_LIKED_PAGE_SIZE))
  if (pageParam) {
    url.searchParams.set('cursor', pageParam)
  }
  return url
}

export const RQKEY_ROOT = 'post-also-liked'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri] as [string, string]

export function usePostAlsoLikedQuery(
  uri: string | undefined,
  opts?: {enabled?: boolean},
) {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useInfiniteQuery<
    AlsoLikedPage,
    Error,
    InfiniteData<AlsoLikedPage>,
    [string, string],
    string | undefined
  >({
    enabled: Boolean(uri) && opts?.enabled !== false,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(uri || ''),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor || undefined,
    async queryFn({pageParam}): Promise<AlsoLikedPage> {
      if (!uri) {
        throw new Error('No post URI provided for also liked query')
      }

      const data = await fetchAlsoLikedSkeleton(uri, pageParam)
      const uris = Array.from(
        new Set(
          (data.feed || [])
            .map(item => item.post)
            .filter((post): post is string => Boolean(post)),
        ),
      ).slice(0, 25)

      if (!uris.length) {
        return {cursor: undefined, posts: []}
      }

      const postsRes = await agent.getPosts({uris})
      if (!postsRes.success) {
        throw new Error('Failed to hydrate also liked recommendations')
      }

      const postsByUri = new Map(
        postsRes.data.posts.map(post => [post.uri, post] as const),
      )

      for (const post of postsRes.data.posts) {
        precachePost(queryClient, post.uri, post)
      }

      return {
        cursor: data.cursor,
        posts: uris
          .map(postUri => postsByUri.get(postUri))
          .filter((post): post is AppBskyFeedDefs.PostView => Boolean(post)),
      }
    },
  })
}

export function* findAllPostsInQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  const atUri = new AtUri(uri)
  const queryDatas = queryClient.getQueriesData<InfiniteData<AlsoLikedPage>>({
    queryKey: [RQKEY_ROOT],
  })

  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }

    for (const page of queryData.pages) {
      for (const post of page.posts) {
        if (uriMatches(atUri, post)) {
          yield post
        }

        const quotedPost = getEmbeddedPost(post.embed)
        if (quotedPost && uriMatches(atUri, quotedPost)) {
          yield embedViewRecordToPostView(quotedPost)
        }
      }
    }
  }
}

function uriMatches(
  atUri: AtUri,
  record: {uri: string; author: AppBskyFeedDefs.PostView['author']},
) {
  if (atUri.host.startsWith('did:')) {
    return atUri.href === record.uri
  }

  return atUri.host === record.author.handle && record.uri.endsWith(atUri.rkey)
}

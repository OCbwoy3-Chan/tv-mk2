import {type AppBskyFeedDefs} from '@atproto/api'
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {precachePost} from '#/state/queries/post'
import {useAgent} from '#/state/session'
import {IS_WEB} from '#/env'

const ALSO_LIKED_URL = 'https://foryou.club/also-liked'
const ALSO_LIKED_PROXY_PATH = '/api/also-liked'
const ALSO_LIKED_PROXY_HOST = 'https://witchsky.app'
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
  const urls = getAlsoLikedUrls(postUri, pageParam)
  let lastError: Error | undefined

  for (const url of urls) {
    try {
      const res = await fetch(url.toString())
      if (!res.ok) {
        lastError = new Error(
          `Failed to load also liked recommendations (${res.status})`,
        )
        continue
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const body = await res.text()
        lastError = new Error(
          body.startsWith('<!DOCTYPE') || body.startsWith('<!doctype')
            ? 'Also liked is unavailable from this web environment right now.'
            : 'Also liked returned an unexpected response.',
        )
        continue
      }

      return (await res.json()) as AlsoLikedSkeletonResponse
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError || new Error('Failed to load also liked recommendations')
}

function getAlsoLikedUrls(postUri: string, pageParam: string | undefined) {
  const urls: URL[] = []
  const appendParams = (url: URL) => {
    url.searchParams.set('format', 'json')
    url.searchParams.set('post', postUri)
    url.searchParams.set('limit', String(ALSO_LIKED_PAGE_SIZE))
    if (pageParam) {
      url.searchParams.set('cursor', pageParam)
    }
    return url
  }

  if (IS_WEB) {
    urls.push(
      appendParams(new URL(ALSO_LIKED_PROXY_PATH, window.location.origin)),
    )

    const hostedProxyUrl = new URL(ALSO_LIKED_PROXY_PATH, ALSO_LIKED_PROXY_HOST)
    if (hostedProxyUrl.origin !== window.location.origin) {
      urls.push(appendParams(hostedProxyUrl))
    }
  } else {
    urls.push(appendParams(new URL(ALSO_LIKED_URL)))
  }

  return urls
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

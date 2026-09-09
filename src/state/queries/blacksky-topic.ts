import {useInfiniteQuery} from '@tanstack/react-query'

import {APPVIEW_PRESETS} from '#/state/preferences/custom-appview-did'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'

/** Blacksky's curated topics return ranked URIs that must be hydrated by the AppView. */
export function useBlackskyTopicQuery(topicId: string) {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  return useInfiniteQuery({
    queryKey: ['blacksky-topic', {topicId, did: currentAccount?.did}],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({pageParam, signal}) => {
      const params = new URLSearchParams({topicId, limit: '25'})
      if (pageParam) params.set('cursor', pageParam)
      const response = await fetch(
        `${APPVIEW_PRESETS.blacksky.url}/xrpc/app.bsky.unspecced.getTopicFeed?${params}`,
        {signal},
      )
      if (!response.ok)
        throw new Error(`getTopicFeed failed: ${response.status}`)
      const data = (await response.json()) as {
        topic: {name: string}
        posts: string[]
        cursor?: string | null
      }
      const hydrated = data.posts.length
        ? await client.call(app.bsky.feed.getPosts, {
            uris: data.posts.slice(
              0,
              25,
            ) as app.bsky.feed.getPosts.$Params['uris'],
          })
        : {posts: []}
      const byUri = new Map(hydrated.posts.map(post => [post.uri, post]))
      return {
        ...data,
        posts: data.posts.flatMap(uri => {
          const post = byUri.get(uri as app.bsky.feed.defs.PostView['uri'])
          return post ? [post] : []
        }),
      }
    },
    getNextPageParam: page => page.cursor ?? undefined,
  })
}

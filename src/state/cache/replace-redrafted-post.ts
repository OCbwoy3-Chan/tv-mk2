import {type InfiniteData, type QueryClient} from '@tanstack/react-query'

import {retry} from '#/lib/async/retry'
import {type FeedPageUnselected} from '#/state/queries/post-feed'
import {type app} from '#/lexicons'

/** Waits for the replacement before deleting the original or updating its slots. */
export async function completeRedraftedPost({
  queryClient,
  uri,
  replacement,
  getPost,
  deletePost,
}: {
  queryClient: QueryClient
  uri: string
  replacement?: app.bsky.feed.defs.PostView
  getPost: () => Promise<app.bsky.feed.defs.PostView>
  deletePost: () => Promise<void>
}) {
  const post = replacement ?? (await retry(5, () => true, getPost, 1000))
  await deletePost()
  replaceRedraftedPost(queryClient, uri, post)
}

/** Removes old feed entries, replacing the first slot when it is the old post. */
export function replaceRedraftedPost(
  queryClient: QueryClient,
  uri: string,
  replacement: app.bsky.feed.defs.PostView,
) {
  queryClient.setQueriesData<InfiniteData<FeedPageUnselected>>(
    {queryKey: ['post-feed']},
    data => {
      if (!data) return data
      const hasReplacement = data.pages.some(page =>
        page.feed.some(item => item.post.uri === replacement.uri),
      )
      let hasPostsAbove = false
      let changed = false
      const pages = data.pages.map(page => {
        let pageChanged = false
        const feed = page.feed.flatMap(item => {
          const isOriginal = item.post.uri === uri
          const replace = isOriginal && !hasPostsAbove && !hasReplacement
          hasPostsAbove = true
          if (!isOriginal) return [item]
          pageChanged = true
          return replace ? [{...item, post: replacement}] : []
        })
        if (!pageChanged) return page
        changed = true
        return {...page, feed}
      })
      return changed ? {...data, pages} : data
    },
  )
  queryClient.setQueriesData(
    {
      predicate: query =>
        ['search-posts', 'post-quotes', 'post-thread-v2'].includes(
          String(query.queryKey[0]),
        ),
    },
    data => replacePostInData(data, uri, replacement),
  )
}

/** Copies only changed branches, preserving pagination and unrelated posts. */
export function replacePostInData(
  data: unknown,
  uri: string,
  replacement: app.bsky.feed.defs.PostView,
): unknown {
  if (!data || typeof data !== 'object') return data
  if (Array.isArray(data)) {
    const next = data.map(item => replacePostInData(item, uri, replacement))
    return next.some((item, index) => item !== data[index]) ? next : data
  }
  if (Object.getPrototypeOf(data) !== Object.prototype) return data

  const object = data as Record<string, unknown>
  if (object.uri === uri && object.author && object.record) return replacement

  let next = object
  for (const [key, value] of Object.entries(object)) {
    // Record links and quoted embeds still refer to the original post.
    if (key === 'record' || key === 'embed') continue
    const updated = replacePostInData(value, uri, replacement)
    if (updated !== value) {
      if (next === object) next = {...object}
      next[key] = updated
    }
  }
  if (next !== object && object.uri === uri && object.value) {
    next.uri = replacement.uri
  }
  return next
}

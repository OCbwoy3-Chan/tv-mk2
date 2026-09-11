import {type QueryClient} from '@tanstack/react-query'

import {type app} from '#/lexicons'

/** Replaces visible post slots without changing their order or quoted records. */
export function replaceRedraftedPost(
  queryClient: QueryClient,
  uri: string,
  replacement: app.bsky.feed.defs.PostView,
) {
  queryClient.setQueriesData(
    {
      predicate: query =>
        ['post-feed', 'search-posts', 'post-quotes', 'post-thread-v2'].includes(
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

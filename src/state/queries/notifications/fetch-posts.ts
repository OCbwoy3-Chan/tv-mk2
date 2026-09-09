import {type Client, XrpcResponseError} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {app} from '#/lexicons'

/** Isolate a broken post without losing the whole page of notifications. */
export async function fetchNotificationPosts(
  client: Client,
  uris: AtUriString[],
): Promise<app.bsky.feed.defs.PostView[]> {
  try {
    return (await client.call(app.bsky.feed.getPosts, {uris})).posts
  } catch (error) {
    if (!(error instanceof XrpcResponseError) || error.status < 500) throw error
    if (uris.length <= 1) return []
    const middle = Math.ceil(uris.length / 2)
    // Sequential halves bound concurrent requests during a server outage.
    const left = await fetchNotificationPosts(client, uris.slice(0, middle))
    const right = await fetchNotificationPosts(client, uris.slice(middle))
    return [...left, ...right]
  }
}

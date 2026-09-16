import {getEmbeddedPost} from '#/state/queries/util'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** A chain requires the main post to quote a post that itself quotes a post. */
export function hasQuoteChain(embed: unknown): boolean {
  const quoted = getEmbeddedPost(embed)
  if (!quoted || !bsky.isType(app.bsky.feed.post, quoted.value)) return false

  const nested = quoted.value.embed
  const ref = bsky.isType(app.bsky.embed.record, nested)
    ? nested.record
    : bsky.isType(app.bsky.embed.recordWithMedia, nested)
      ? nested.record.record
      : undefined

  return Boolean(ref?.uri.includes('/app.bsky.feed.post/'))
}

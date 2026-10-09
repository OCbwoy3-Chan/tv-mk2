import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Whether a quote embeds an account blocked by the current viewer. */
export function quotesBlockedAccount(embed: unknown): boolean {
  const quote = bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
    ? embed.record
    : embed
  if (!bsky.isType(app.bsky.embed.record.view, quote)) return false

  const record = quote.record
  if (
    !bsky.isType(app.bsky.embed.record.viewBlocked, record) &&
    !bsky.isType(app.bsky.embed.record.viewRecord, record)
  ) {
    return false
  }

  return Boolean(
    record.author.viewer?.blocking || record.author.viewer?.blockingByList,
  )
}

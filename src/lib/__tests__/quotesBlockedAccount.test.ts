import {quotesBlockedAccount} from '#/lib/quotesBlockedAccount'

function quote(type: string, viewer?: object, withMedia = false) {
  const record = {
    $type: 'app.bsky.embed.record#view',
    record: {
      $type: `app.bsky.embed.record#${type}`,
      author: {did: 'did:plc:blocked', viewer},
    },
  }
  return withMedia
    ? {$type: 'app.bsky.embed.recordWithMedia#view', record}
    : record
}

describe('quotesBlockedAccount', () => {
  it.each(['viewBlocked', 'viewRecord'])(
    'recognizes direct and list blocks in %s, with or without media',
    type => {
      for (const withMedia of [false, true]) {
        expect(
          quotesBlockedAccount(quote(type, {blocking: 'at://block'}, withMedia)),
        ).toBe(true)
        expect(
          quotesBlockedAccount(quote(type, {blockingByList: {}}, withMedia)),
        ).toBe(true)
      }
    },
  )

  it('does not confuse incoming blocks or mutes with outgoing blocks', () => {
    expect(
      quotesBlockedAccount(quote('viewBlocked', {blockedBy: true})),
    ).toBe(false)
    expect(quotesBlockedAccount(quote('viewRecord', {muted: true}))).toBe(false)
    expect(quotesBlockedAccount(quote('viewBlocked'))).toBe(false)
    expect(quotesBlockedAccount(quote('viewRecord'))).toBe(false)
  })

  it('ignores missing, detached, and non-quote embeds', () => {
    expect(quotesBlockedAccount(undefined)).toBe(false)
    expect(quotesBlockedAccount({$type: 'app.bsky.embed.images#view'})).toBe(false)
    expect(quotesBlockedAccount(quote('viewNotFound'))).toBe(false)
    expect(quotesBlockedAccount(quote('viewDetached'))).toBe(false)
  })
})

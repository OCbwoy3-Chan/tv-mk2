import {hasQuoteChain} from '#/screens/Post/QuoteChain/util'

const postUri = 'at://did:plc:author/app.bsky.feed.post/third'

function record(uri = postUri) {
  return {$type: 'app.bsky.embed.record', record: {uri, cid: 'cid'}}
}

function quote(embed?: unknown, withMedia = false) {
  const view = {
    $type: 'app.bsky.embed.record#view',
    record: {
      $type: 'app.bsky.embed.record#viewRecord',
      value: {$type: 'app.bsky.feed.post', embed},
    },
  }
  return withMedia
    ? {$type: 'app.bsky.embed.recordWithMedia#view', record: view}
    : view
}

describe('hasQuoteChain', () => {
  it('requires both levels of quoting', () => {
    expect(hasQuoteChain(undefined)).toBe(false)
    expect(hasQuoteChain(quote())).toBe(false)
    expect(hasQuoteChain(quote(record()))).toBe(true)
  })

  it('supports media at either quote level', () => {
    expect(hasQuoteChain(quote(record(), true))).toBe(true)
    const withMedia = {
      $type: 'app.bsky.embed.recordWithMedia',
      record: record(),
    }
    expect(hasQuoteChain(quote(withMedia))).toBe(true)
    expect(hasQuoteChain(quote(withMedia, true))).toBe(true)
  })

  it('does not count quoted feeds or lists as posts', () => {
    expect(
      hasQuoteChain(
        quote(record('at://did:plc:author/app.bsky.feed.generator/feed')),
      ),
    ).toBe(false)
    expect(
      hasQuoteChain(quote(record('at://did:plc:author/app.bsky.graph.list/list'))),
    ).toBe(false)
  })

  it.each(['viewBlocked', 'viewNotFound', 'viewDetached'])(
    'hides the button for %s quotes',
    type => {
      expect(
        hasQuoteChain({
          $type: 'app.bsky.embed.record#view',
          record: {$type: `app.bsky.embed.record#${type}`},
        }),
      ).toBe(false)
    },
  )
})

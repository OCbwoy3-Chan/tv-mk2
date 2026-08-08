import {expandPostTextRich} from './post-embed'

const author = {
  did: 'did:plc:alice',
  displayName: 'Alice',
  handle: 'alice.test',
}

describe('expandPostTextRich', () => {
  it('expands shortened links using UTF-8 facet offsets', () => {
    const text = 'Emoji 👋 example.com/long... done'
    const segment = 'example.com/long...'
    const byteStart = new TextEncoder().encode(
      text.slice(0, text.indexOf(segment)),
    ).length
    const byteEnd = byteStart + new TextEncoder().encode(segment).length

    expect(
      expandPostTextRich({
        $type: 'app.bsky.feed.defs#threadViewPost',
        post: {
          author,
          indexedAt: '2026-08-08T00:00:00.000Z',
          record: {
            text,
            facets: [
              {
                index: {byteStart, byteEnd},
                features: [
                  {
                    $type: 'app.bsky.richtext.facet#link',
                    uri: 'https://example.com/longer-destination',
                  },
                ],
              },
            ],
          },
        },
      }),
    ).toBe('Emoji 👋 https://example.com/longer-destination done')
  })

  it('includes reply and quoted-post context', () => {
    expect(
      expandPostTextRich({
        $type: 'app.bsky.feed.defs#threadViewPost',
        parent: {
          $type: 'app.bsky.feed.defs#threadViewPost',
          post: {
            author: {...author, displayName: 'Parent'},
            indexedAt: '2026-08-08T00:00:00.000Z',
          },
        },
        post: {
          author,
          embed: {
            $type: 'app.bsky.embed.record#view',
            record: {
              $type: 'app.bsky.embed.record#viewRecord',
              author: {...author, displayName: 'Quoted'},
              value: {text: 'quoted text'},
            },
          },
          indexedAt: '2026-08-08T00:00:00.000Z',
          record: {text: 'reply text'},
        },
      }),
    ).toBe(
      '↩️ reply to Parent (@alice.test):\n\nreply text\n\n↘️ quoting Quoted (@alice.test):\n\nquoted text',
    )
  })
})

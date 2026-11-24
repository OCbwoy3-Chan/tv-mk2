import {
  expandPostTextRich,
  getPreviewMedia,
  renderEmbedMeta,
  renderHeadMeta,
} from './post-embed'

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

  it('quotes through recordWithMedia', () => {
    expect(
      expandPostTextRich({
        $type: 'app.bsky.feed.defs#threadViewPost',
        post: {
          author,
          embed: {
            $type: 'app.bsky.embed.recordWithMedia#view',
            media: {$type: 'app.bsky.embed.images#view', images: []},
            record: {
              $type: 'app.bsky.embed.record#view',
              record: {
                $type: 'app.bsky.embed.record#viewRecord',
                author: {...author, displayName: 'Quoted'},
                value: {text: 'quoted text'},
              },
            },
          },
          indexedAt: '2026-08-08T00:00:00.000Z',
          record: {text: 'reply text'},
        },
      }),
    ).toBe('reply text\n\n↘️ quoting Quoted (@alice.test):\n\nquoted text')
  })

  it('falls back to a placeholder when the quoted post is unavailable', () => {
    for (const $type of [
      'app.bsky.embed.record#viewNotFound',
      'app.bsky.embed.record#viewBlocked',
    ]) {
      expect(
        expandPostTextRich({
          $type: 'app.bsky.feed.defs#threadViewPost',
          post: {
            author,
            embed: {
              $type: 'app.bsky.embed.record#view',
              record: {$type, uri: 'at://did:plc:gone/app.bsky.feed.post/1'},
            },
            indexedAt: '2026-08-08T00:00:00.000Z',
            record: {text: 'reply text'},
          },
        }),
      ).toBe('reply text\n\n[quote/embed]')
    }
  })
})

function threadWith(embed: any) {
  return {
    $type: 'app.bsky.feed.defs#threadViewPost',
    post: {
      author,
      embed,
      indexedAt: '2026-08-08T00:00:00.000Z',
      record: {text: 'post text'},
    },
  }
}

const videoEmbed = {
  $type: 'app.bsky.embed.video#view',
  cid: 'bafyvideo',
  playlist: 'https://video.bsky.app/watch/did%3Aplc%3Aalice/playlist.m3u8',
  thumbnail: 'https://video.bsky.app/thumb.jpg',
  aspectRatio: {height: 1920, width: 1080},
}

describe('getPreviewMedia', () => {
  it('uses the post own video thumbnail', () => {
    expect(getPreviewMedia(threadWith(videoEmbed))).toMatchObject({
      kind: 'video',
      thumbnail: 'https://video.bsky.app/thumb.jpg',
    })
  })

  it('borrows the quoted post media when the post has none', () => {
    const media = getPreviewMedia(
      threadWith({
        $type: 'app.bsky.embed.record#view',
        record: {
          $type: 'app.bsky.embed.record#viewRecord',
          author,
          value: {text: 'quoted text'},
          embeds: [videoEmbed],
        },
      }),
    )

    expect(media).toMatchObject({
      kind: 'video',
      thumbnail: 'https://video.bsky.app/thumb.jpg',
    })
  })

  it('uses the media half of recordWithMedia', () => {
    const media = getPreviewMedia(
      threadWith({
        $type: 'app.bsky.embed.recordWithMedia#view',
        media: {
          $type: 'app.bsky.embed.images#view',
          images: [{thumb: 'a.jpg'}, {thumb: 'b.jpg'}],
        },
        record: {
          $type: 'app.bsky.embed.record#view',
          record: {$type: 'app.bsky.embed.record#viewRecord', author},
        },
      }),
    )

    expect(media).toEqual({kind: 'images', urls: ['a.jpg', 'b.jpg']})
  })

  it('returns nothing for a text-only post', () => {
    expect(getPreviewMedia(threadWith(undefined))).toBeUndefined()
  })
})

describe('renderEmbedMeta', () => {
  const tags = (media: Parameters<typeof renderEmbedMeta>[0]) =>
    renderEmbedMeta(media).toString()

  it('previews a video as a card so Discord keeps the post text', () => {
    const out = tags({
      kind: 'video',
      cid: 'bafy',
      did: 'did:plc:a',
      thumbnail: 'thumb.jpg',
    })

    expect(out).toContain('property="og:image" content="thumb.jpg"')
    expect(out).toContain('name="twitter:image" content="thumb.jpg"')
    expect(out).toContain('name="twitter:card" content="summary_large_image"')

    /*
     * `og:video` and `twitter:card=player` select Discord's player layout,
     * which renders the title but never the description.
     */
    expect(out).not.toContain('og:video')
    expect(out).not.toContain('twitter:player')
    expect(out).not.toContain('"player"')
  })

  it('falls back to a summary card for a video without a thumbnail', () => {
    expect(tags({kind: 'video', cid: 'bafy', did: 'did:plc:a'})).toContain(
      'content="summary"',
    )
  })

  it('caps images at four', () => {
    const out = tags({
      kind: 'images',
      urls: ['1.jpg', '2.jpg', '3.jpg', '4.jpg'],
    })

    expect(out.match(/property="og:image"/g)).toHaveLength(4)
    expect(out).toContain('summary_large_image')
  })

  it('falls back to a summary card', () => {
    expect(tags(undefined)).toContain('content="summary"')
  })
})

describe('renderHeadMeta', () => {
  const url = 'https://witchsky.app/profile/alice.test/post/3abc'
  const head = (postText: string, embed: any) =>
    renderHeadMeta({
      appName: 'Witchsky',
      postText,
      thread: threadWith(embed),
      url,
    }).toString()

  it('carries the post text in a Discord component embed next to the video', () => {
    const out = head('look at this clip', videoEmbed)

    expect(out).toContain('name="description" content="look at this clip"')
    expect(out).toContain('<script id="discord:component-embed"')
    // The text is inside the payload, not just in the Open Graph tags.
    expect(out).toContain('look at this clip')
    expect(out).toContain('/video/did:plc:alice/bafyvideo')
    expect(out).not.toContain('og:video')
  })

  it('trims a long post text instead of dropping the video', () => {
    const out = head('x'.repeat(6000), videoEmbed)
    const payload = out.match(
      /<script id="discord:component-embed"[^>]*>([\s\S]*?)<\/script>/,
    )

    expect(payload).toBeTruthy()
    expect(new TextEncoder().encode(payload![1]).length).toBeLessThanOrEqual(
      3000,
    )
    expect(out).not.toContain('og:video')
  })

  it('keeps the text card when even the empty component embed cannot fit', () => {
    const hugeAvatar = `https://cdn.test/${'a'.repeat(3000)}`
    const out = renderHeadMeta({
      appName: 'Witchsky',
      postText: 'look at this clip',
      thread: (() => {
        const thread = threadWith(videoEmbed)
        thread.post.author = {...author, avatar: hugeAvatar}
        return thread
      })(),
      url,
    }).toString()

    expect(out).not.toContain('discord:component-embed')
    expect(out).toContain('name="twitter:card" content="summary_large_image"')
    expect(out).toContain('property="og:type" content="article"')
    expect(out).toContain('name="description" content="look at this clip"')
  })

  it('leaves text-only posts on a plain card', () => {
    const out = head('just words', undefined)

    expect(out).not.toContain('discord:component-embed')
    expect(out).toContain('name="twitter:card" content="summary"')
    expect(out).toContain('property="og:type" content="article"')
  })
})

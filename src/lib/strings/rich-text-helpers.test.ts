import {RichText} from '@atproto/api'

import {richTextToStringPreservingLinks} from './rich-text-helpers'

describe('richTextToStringPreservingLinks', () => {
  it('preserves the visible labels of multiple masked links', () => {
    const text = 'first and docs and third'
    const richText = new RichText({
      text,
      facets: [
        {
          index: {byteStart: 0, byteEnd: 5},
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: 'https://one.example/destination',
            },
          ],
        },
        {
          index: {byteStart: 10, byteEnd: 14},
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: 'https://docs.example/other-page',
            },
          ],
        },
        {
          index: {byteStart: 19, byteEnd: 24},
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: 'https://three.example/destination',
            },
          ],
        },
      ],
    })

    expect(richTextToStringPreservingLinks(richText)).toBe(
      '[first](https://one.example/destination) and [docs](https://docs.example/other-page) and [third](https://three.example/destination)',
    )
  })

  it('does not wrap a link whose text is already its destination', () => {
    const uri = 'https://example.com/page'
    const richText = new RichText({
      text: uri,
      facets: [
        {
          index: {byteStart: 0, byteEnd: uri.length},
          features: [
            {$type: 'app.bsky.richtext.facet#link', uri},
          ],
        },
      ],
    })

    expect(richTextToStringPreservingLinks(richText)).toBe(uri)
  })
})

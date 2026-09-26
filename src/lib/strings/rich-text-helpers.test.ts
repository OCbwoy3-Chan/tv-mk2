import {RichText} from '@bsky/sdk/richtext'

import {
  richTextToRedraftString,
  richTextToStringPreservingLinks,
} from './rich-text-helpers'
import {applyFacetSyntax, parseMarkdownLinks} from './rich-text-manip'
import {toShortUrl} from './url-helpers'

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
          features: [{$type: 'app.bsky.richtext.facet#link', uri}],
        },
      ],
    })

    expect(richTextToStringPreservingLinks(richText)).toBe(uri)
  })
})

it('restores an ordinary truncated URL without masked-link syntax', () => {
  const uri = 'https://example.com/a/long/path/to/a/page'
  const text = toShortUrl(uri)
  const rt = new RichText({
    text,
    facets: [
      {
        index: {byteStart: 0, byteEnd: text.length},
        features: [{$type: 'app.bsky.richtext.facet#link', uri}],
      },
    ],
  })
  expect(richTextToStringPreservingLinks(rt)).toBe(uri)
})

describe('richTextToRedraftString', () => {
  it('escapes plain links, handles, and syntax without changing posted text', () => {
    const text =
      '🌟 example.com @person.test \\example.org [label](site.test) <foo.com>'
    const redraft = richTextToRedraftString(new RichText({text}))

    expect(redraft).toBe(
      '🌟 \\example.com \\@person.test \\\\example.org \\[label](site.test) \\<foo.com>',
    )

    const parsed = parseMarkdownLinks(redraft)
    const repost = new RichText({text: parsed.text})
    repost.detectFacetsWithoutResolution()
    applyFacetSyntax(repost, {removeSyntax: true})

    expect(repost.text).toBe(text)
    expect(repost.facets).toBeUndefined()
  })

  it('preserves existing link facets while escaping adjacent plain links', () => {
    const text = 'example.com and docs.example'
    const richText = new RichText({
      text,
      facets: [
        {
          index: {byteStart: 16, byteEnd: 28},
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: 'https://docs.example/guide',
            },
          ],
        },
      ],
    })

    expect(richTextToRedraftString(richText)).toBe(
      '\\example.com and [docs.example](https://docs.example/guide)',
    )
  })
})

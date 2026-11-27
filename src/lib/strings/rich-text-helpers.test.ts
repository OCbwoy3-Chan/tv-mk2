import {RichText} from '@bsky/sdk/richtext'

import {featureOf, kindOf, piecesOf, shift} from './formatting'
import {richTextToRedraftString} from './rich-text-helpers'
import {
  applyFacetSyntax,
  parseMarkdownLinks,
  shortenLinks,
} from './rich-text-manip'
import {toShortUrl} from './url-helpers'

describe('richTextToRedraftString', () => {
  it.each([
    'https://breezewiki.com/starwars/wiki/67_(disambiguation)',
    'https://example.com/a(b(c)d',
  ] as const)(
    'preserves a masked destination containing parentheses: %s',
    uri => {
      const original = new RichText({
        text: 'page',
        facets: [
          {
            index: {byteStart: 0, byteEnd: 4},
            features: [{$type: 'app.bsky.richtext.facet#link', uri}],
          },
        ],
      })
      const redraft = richTextToRedraftString(original)

      expect(redraft).toBe(`[page](<${uri}>)`)
      expect(parseMarkdownLinks(redraft)).toEqual({
        text: original.text,
        facets: original.facets,
      })
    },
  )

  it('round trips an unfaceted masked link containing parentheses', () => {
    const text = '[page](<https://example.com/a(b)>)'
    const redraft = richTextToRedraftString(new RichText({text}))
    const parsed = parseMarkdownLinks(redraft)
    const repost = new RichText({text: parsed.text})
    repost.detectFacetsWithoutResolution()
    applyFacetSyntax(repost, {removeSyntax: true})

    expect(redraft).toBe('\\[page](\\<https://example.com/a(b)>)')
    expect(repost.text).toBe(text)
    expect(repost.facets).toBeUndefined()
  })

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

    expect(richTextToRedraftString(richText)).toBe(
      '[first](https://one.example/destination) and [docs](https://docs.example/other-page) and [third](https://three.example/destination)',
    )
  })

  it('preserves a full URL label as an explicit masked link', () => {
    const uri = 'https://example.com/a/long/path/to/a/page'
    const richText = new RichText({
      text: uri,
      facets: [
        {
          index: {byteStart: 0, byteEnd: uri.length},
          features: [{$type: 'app.bsky.richtext.facet#link', uri}],
        },
      ],
    })

    expect(richTextToRedraftString(richText)).toBe(`[${uri}](${uri})`)

    const parsed = parseMarkdownLinks(richTextToRedraftString(richText))
    const repost = new RichText({
      text: parsed.text,
      facets: parsed.facets as unknown as NonNullable<RichText['facets']>,
    })
    const shortened = shortenLinks(repost, true, parsed.facets)
    expect(shortened.text).toBe(uri)
    expect(shortened.facets).toEqual(richText.facets)
  })
})

it('restores a normally truncated URL without masked syntax', () => {
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
  expect(richTextToRedraftString(rt)).toBe(uri)

  const repost = new RichText({text: richTextToRedraftString(rt)})
  repost.detectFacetsWithoutResolution()
  const shortened = shortenLinks(repost, true)
  expect(shortened.text).toBe(text)
  expect(shortened.facets).toEqual(rt.facets)
})

describe('richTextToRedraftString', () => {
  it('escapes plain links, handles, and syntax without changing posted text', () => {
    const text =
      '🌟 example.com @person.test #topic $TSLA \\example.org [label](site.test) <foo.com> <#other> <$AAPL>'
    const redraft = richTextToRedraftString(new RichText({text}))

    expect(redraft).toBe(
      '🌟 \\example.com \\@person.test \\#topic \\$TSLA \\\\example.org \\[label](site.test) \\<foo.com> \\<#other> \\<$AAPL>',
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

  it('restores angle syntax for facets that need a boundary', () => {
    const text = 'x#topic y$TSLA zexample.com'
    const original = new RichText({
      text,
      facets: [
        {
          index: {byteStart: 1, byteEnd: 7},
          features: [{$type: 'app.bsky.richtext.facet#tag', tag: 'topic'}],
        },
        {
          index: {byteStart: 9, byteEnd: 14},
          features: [{$type: 'app.bsky.richtext.facet#tag', tag: '$TSLA'}],
        },
        {
          index: {byteStart: 16, byteEnd: 27},
          features: [
            {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
          ],
        },
      ],
    })
    const redraft = richTextToRedraftString(original)

    expect(redraft).toBe('x<#topic> y<$TSLA> z<example.com>')

    const repost = new RichText({text: redraft})
    repost.detectFacetsWithoutResolution()
    applyFacetSyntax(repost, {removeSyntax: true})

    expect(repost.text).toBe(text)
    expect(repost.facets?.map(facet => facet.index)).toEqual(
      original.facets?.map(facet => facet.index),
    )
  })

  it('restores angle syntax for a mention inside a word', () => {
    const text = 'x@person.test'
    const original = new RichText({
      text,
      facets: [
        {
          index: {byteStart: 1, byteEnd: text.length},
          features: [
            {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:person'},
          ],
        },
      ],
    })

    expect(richTextToRedraftString(original)).toBe('x<@person.test>')
  })
})

describe('formatting redrafts', () => {
  function repost(text: string) {
    const parsed = parseMarkdownLinks(text)
    const rt = new RichText({text: parsed.text})
    rt.detectFacetsWithoutResolution()
    rt.facets = [
      ...(rt.facets ?? []).filter(
        f =>
          !parsed.facets.some(
            link =>
              f.index.byteStart < link.index.byteEnd &&
              f.index.byteEnd > link.index.byteStart,
          ),
      ),
      ...parsed.facets,
    ] as typeof rt.facets
    return applyFacetSyntax(rt, {removeSyntax: true})
  }

  it('decodes spoilers and preserves nested formatting and links through a repost', () => {
    const source =
      '🌟 **bold *italic* [page](https://example.com)** ||secret 123 世||'
    const original = repost(source)
    const redraft = richTextToRedraftString(original)
    expect(redraft).toBe(source)
    expect(original.text).toContain(shift('secret 123 世'))
    const again = repost(redraft)
    expect(again.text).toBe(original.text)
    expect(again.facets).toEqual(original.facets)
  })

  it('creates source syntax for foreign formatting facets without markers', () => {
    const original = new RichText({
      text: 'hello world',
      facets: [
        {index: {byteStart: 0, byteEnd: 11}, features: [featureOf('bold')]},
        {index: {byteStart: 6, byteEnd: 11}, features: [featureOf('italic')]},
      ],
    })
    const redraft = richTextToRedraftString(original)
    expect(redraft).toBe('**hello *world***')
    expect(
      piecesOf(repost(redraft).text, repost(redraft).facets)
        .map(p => p.text)
        .join(''),
    ).toBe('hello world')
    expect(
      repost(redraft)
        .facets?.flatMap(f => f.features)
        .map(kindOf),
    ).toEqual(['bold', 'italic'])
  })

  it('does not promote plain Markdown into formatting while redrafting', () => {
    const text = '**literal** *literal* ~~literal~~ ||literal|| `literal`'
    const redraft = richTextToRedraftString(new RichText({text}))
    const again = repost(redraft)
    expect(again.text).toBe(text)
    expect(again.facets ?? []).toEqual([])
  })

  it('round trips escaped literal markers alongside a real formatting facet', () => {
    const original = repost(
      String.raw`**bold** \*literal* \\path ||hidden \*literal*||`,
    )
    const redraft = richTextToRedraftString(original)
    const again = repost(redraft)
    expect(again.text).toBe(original.text)
    expect(again.facets).toEqual(original.facets)
  })

  it('decodes markerless Unicode spoilers without losing their group', () => {
    const text = shift('héllo 123 🌟')
    const original = new RichText({
      text,
      facets: [
        {
          index: {byteStart: 0, byteEnd: new TextEncoder().encode(text).length},
          features: [featureOf('spoiler')],
        },
      ],
    })
    expect(richTextToRedraftString(original)).toBe('||héllo 123 🌟||')
  })
})

it('redrafts mentions inside overlapping formatting without escaping their angle syntax', () => {
  const original = new RichText({
    text: '@person.test',
    facets: [
      {
        index: {byteStart: 0, byteEnd: 12},
        features: [
          featureOf('bold'),
          {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:person'},
        ],
      },
    ],
  })
  expect(richTextToRedraftString(original)).toBe('**<@person.test>**')
})

it('splits a foreign link around nested formatting instead of hiding markers inside its label', () => {
  const original = new RichText({
    text: 'one two three',
    facets: [
      {
        index: {byteStart: 0, byteEnd: 13},
        features: [
          {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
        ],
      },
      {index: {byteStart: 4, byteEnd: 7}, features: [featureOf('bold')]},
    ],
  })
  expect(richTextToRedraftString(original)).toBe(
    '[one ](https://example.com)**[two](https://example.com)**[ three](https://example.com)',
  )
})

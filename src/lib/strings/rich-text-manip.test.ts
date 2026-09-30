import {type Client} from '@atproto/lex'
import {RichText} from '@bsky/sdk/richtext'

import {
  applyFacetSyntax,
  parseMarkdownLinks,
  resolveSyntaxMentions,
  shortenLinks,
} from './rich-text-manip'

function prepare(text: string, removeSyntax = true) {
  const parsed = parseMarkdownLinks(text)
  const rt = new RichText({text: parsed.text})
  rt.detectFacetsWithoutResolution()
  rt.facets = [
    ...(rt.facets ?? []).filter(
      facet =>
        !parsed.facets.some(
          markdown =>
            facet.index.byteStart < markdown.index.byteEnd &&
            facet.index.byteEnd > markdown.index.byteStart,
        ),
    ),
    ...(parsed.facets as unknown as NonNullable<typeof rt.facets>),
  ]
  return applyFacetSyntax(rt, {removeSyntax})
}

function facetTexts(rt: RichText) {
  return rt.facets?.map(facet =>
    rt.unicodeText.slice(facet.index.byteStart, facet.index.byteEnd),
  )
}

describe('facet syntax', () => {
  it('preserves an explicit full URL label while shortening ordinary URLs', () => {
    const uri =
      'https://full-link.example/a-really-long-link-that-would-normally-be-truncated'
    const parsed = parseMarkdownLinks(
      `[${uri}](${uri}) and https://example.com/another-long-path`,
    )
    const rt = new RichText({text: parsed.text})
    rt.detectFacetsWithoutResolution()
    rt.facets = [
      ...(rt.facets ?? []).filter(facet => facet.index.byteStart > uri.length),
      ...parsed.facets,
    ] as typeof rt.facets
    applyFacetSyntax(rt, {removeSyntax: true})
    const shortened = shortenLinks(rt, true, parsed.facets)

    expect(shortened.text).toBe(`${uri} and example.com/another-long...`)
    expect(facetTexts(shortened)).toEqual([uri, 'example.com/another-long...'])
    expect(shortened.graphemeLength).toBe(shortened.text.length)
  })

  it('preserves theme labels and byte ranges when posting masked links', () => {
    const labels = ['Mocha', 'Macchiato', 'Frappé', 'Latte']
    const uris = labels.map(
      (_, index) =>
        `https://witchsky.app/profile/did:plc:themes/theme/${index}`,
    )
    const input = `enjoy :3\n\n\n${labels
      .map((label, index) => `[${label}](${uris[index]})`)
      .join('\n')}`
    const cleaned = new RichText({text: input}, {cleanNewlines: true})
    const rt = shortenLinks(prepare(cleaned.text), true)

    expect(rt.text).toBe('enjoy :3\n\nMocha\nMacchiato\nFrappé\nLatte')
    expect(facetTexts(rt)).toEqual(labels)
    expect(rt.facets?.map(facet => facet.features[0])).toEqual(
      uris.map(uri => ({$type: 'app.bsky.richtext.facet#link', uri})),
    )
  })

  it('keeps UTF-8 facet ranges when shortening a Unicode link label', () => {
    const rt = prepare(
      '[Frappé](example.com/frappe)\n[Latte](example.com/latte)',
    )
    const shortened = shortenLinks(rt)

    expect(shortened.text).toBe('Frappé\nLatte')
    expect(facetTexts(shortened)).toEqual(['Frappé', 'Latte'])
    expect(facetTexts(rt)).toEqual(['Frappé', 'Latte'])
  })

  it('keeps later tags and masked links aligned after shortening a Unicode URL', () => {
    const rt = prepare(
      'https://example.com/é #topic [🦋](example.com/butterfly)',
    )
    const shortened = shortenLinks(rt, true)

    expect(shortened.text).toBe('example.com/%C3%A9 #topic 🦋')
    expect(facetTexts(shortened)).toEqual([
      'example.com/%C3%A9',
      '#topic',
      '🦋',
    ])
    expect(rt.text).toBe('https://example.com/é #topic 🦋')
    expect(facetTexts(rt)).toEqual(['https://example.com/é', '#topic', '🦋'])
  })

  it('uses a backslash to keep a link or handle plain', () => {
    const rt = prepare(
      '🌟 \\file.com \\@person.test https://outside.example.com',
    )

    expect(rt.text).toBe('🌟 file.com @person.test https://outside.example.com')
    expect(facetTexts(rt)).toEqual(['https://outside.example.com'])
  })

  it('uses a backslash to keep hashtags and cashtags plain', () => {
    const rt = prepare('🌟 \\#topic \\$TSLA #linked $AAPL')

    expect(rt.text).toBe('🌟 #topic $TSLA #linked $AAPL')
    expect(facetTexts(rt)).toEqual(['#linked', '$AAPL'])
  })

  it('collapses two backslashes to one literal backslash', () => {
    const rt = prepare('\\\\file.com')

    expect(rt.text).toBe('\\file.com')
    expect(facetTexts(rt)).toEqual([])
  })

  it('keeps an angle-enclosed link and handle faceted and removes the brackets', () => {
    const rt = prepare('🌟 <example.com>! <@person.test>, <ordinary text>')

    expect(rt.text).toBe('🌟 example.com! @person.test, <ordinary text>')
    expect(facetTexts(rt)).toEqual(['example.com', '@person.test'])
    expect(rt.facets?.map(facet => facet.features[0].$type)).toEqual([
      'app.bsky.richtext.facet#link',
      'app.bsky.richtext.facet#mention',
    ])
  })

  it('facets angle-enclosed hashtags and cashtags', () => {
    const rt = prepare('prefix<#topic.> and <$TSLA>!')

    expect(rt.text).toBe('prefix#topic. and $TSLA!')
    expect(facetTexts(rt)).toEqual(['#topic', '$TSLA'])
    expect(rt.facets?.map(facet => facet.features[0].$type)).toEqual([
      'app.bsky.richtext.facet#tag',
      'app.bsky.richtext.facet#tag',
    ])
  })

  it('leaves the punctuation inside brackets outside the link facet', () => {
    const rt = prepare('<https://example.com/path.>')

    expect(rt.text).toBe('https://example.com/path.')
    expect(facetTexts(rt)).toEqual(['https://example.com/path'])
  })

  it('leaves ordinary angle-bracketed text alone', () => {
    const rt = prepare('<example.com notes>')

    expect(rt.text).toBe('<example.com notes>')
    expect(facetTexts(rt)).toEqual([])
  })

  it('lets a backslash escape the angle syntax', () => {
    const rt = prepare('\\<example.com>')

    expect(rt.text).toBe('<example.com>')
    expect(facetTexts(rt)).toEqual([])
  })

  it('lets a backslash escape enclosed tags', () => {
    const rt = prepare('\\<#topic> \\<$TSLA>')

    expect(rt.text).toBe('<#topic> <$TSLA>')
    expect(facetTexts(rt)).toEqual([])
  })

  it('escapes masked markdown links without linking their destination', () => {
    const rt = prepare('\\[label](example.com)')

    expect(rt.text).toBe('[label](example.com)')
    expect(facetTexts(rt)).toEqual([])
  })

  it('lets a doubled backslash precede a masked link', () => {
    const rt = prepare('\\\\[label](example.com)')

    expect(rt.text).toBe('\\label')
    expect(facetTexts(rt)).toEqual(['label'])
  })

  it('preserves angle brackets in the editor while faceting their contents', () => {
    const rt = prepare('<example.com>', false)

    expect(rt.text).toBe('<example.com>')
    expect(facetTexts(rt)).toEqual(['example.com'])
  })

  it('resolves an angle-enclosed handle before posting', async () => {
    const rt = prepare('<@person.test>')
    const client = {
      call: jest.fn().mockResolvedValue({did: 'did:plc:person'}),
    } as unknown as Client

    await resolveSyntaxMentions(rt, client)

    expect(rt.facets?.[0].features[0]).toMatchObject({
      $type: 'app.bsky.richtext.facet#mention',
      did: 'did:plc:person',
    })
  })
})

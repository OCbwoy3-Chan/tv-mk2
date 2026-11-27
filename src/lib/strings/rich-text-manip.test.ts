import {type Client, type Unknown$TypedObject} from '@atproto/lex'
import {RichText} from '@bsky/sdk/richtext'

import {featureOf, kindOf, piecesOf, shift} from './formatting'
import {
  applyFacetSyntax,
  applyMarkdownLinkFacets,
  getFacetSyntaxRemovalIndices,
  parseMarkdownLinks,
  resolveSyntaxMentions,
  shortenLinks,
  splitFacetSyntax,
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

function facetTexts(rt: RichText, onlyLinks = false) {
  return rt.facets
    ?.filter(
      facet =>
        !onlyLinks ||
        facet.features.some(
          feature => feature.$type === 'app.bsky.richtext.facet#link',
        ),
    )
    .map(facet =>
      rt.unicodeText.slice(facet.index.byteStart, facet.index.byteEnd),
    )
}

describe('facet syntax', () => {
  it.each(['example.com', 'example.com:8080/path', 'localhost:3000/path'])(
    'continues to add HTTPS to a bare web destination: %s',
    destination => {
      expect(
        parseMarkdownLinks(`[here](${destination})`).facets[0].features[0],
      ).toEqual({
        $type: 'app.bsky.richtext.facet#link',
        uri: `https://${destination}`,
      })
    },
  )

  it.each([
    'steam://launch/3817250',
    'STEAM://launch/3817250',
    'spotify://track/123',
    'custom+app.v2-test://open/item',
    'mailto:hello@example.com',
    'tel:+15551234567',
    'HTTPS://example.com/path',
  ])(
    'preserves an explicit masked URI in editor and posted facets: %s',
    uri => {
      for (const destination of [uri, `<${uri}>`]) {
        const text = `🌟 [here](${destination})`
        const editor = new RichText({text})
        editor.detectFacetsWithoutResolution()
        applyMarkdownLinkFacets(editor)
        applyFacetSyntax(editor)

        expect(editor.facets?.flatMap(facet => facet.features)).toEqual(
          Array.from({length: destination.startsWith('<') ? 3 : 1}, () => ({
            $type: 'app.bsky.richtext.facet#link',
            uri,
          })),
        )
        const posted = prepare(text)
        expect(posted.text).toBe('🌟 here')
        expect(posted.facets).toEqual([
          {
            index: {byteStart: 5, byteEnd: 9},
            features: [{$type: 'app.bsky.richtext.facet#link', uri}],
          },
        ])
      }
    },
  )

  it.each(['!', '?', '?!', '.)*', '!)*', ', next'])(
    'keeps punctuation outside masked editor and posted facets: %s',
    suffix => {
      const masked = '[with masked links](like.so)'
      const text = `(*text ${masked}${suffix}`
      const editor = new RichText({text})
      editor.detectFacetsWithoutResolution()
      applyMarkdownLinkFacets(editor)
      applyFacetSyntax(editor)

      expect(facetTexts(editor, true)).toEqual([masked])
      const posted = prepare(text)
      expect(posted.text).toBe(`(*text with masked links${suffix}`)
      expect(facetTexts(posted, true)).toEqual(['with masked links'])
    },
  )
  it.each([
    '<example.com>',
    '🌟 <@person.test> <#topic> <$TSLA>',
    '\\example.com \\#topic \\$TSLA',
    '\\\\example.com',
    '\\\\\\example.com',
    '\\<example.com>',
    '\\[page](<https://example.com/a(b)>)',
    '<ordinary text> \\ordinary',
  ])('dims exactly the facet syntax removed when posting: %s', text => {
    const rt = new RichText({text})
    rt.detectFacetsWithoutResolution()
    const indices = getFacetSyntaxRemovalIndices(rt)
    const segments = splitFacetSyntax(text, 0, indices)
    const posted = applyFacetSyntax(rt.clone(), {removeSyntax: true})

    expect(segments.map(segment => segment.text).join('')).toBe(text)
    expect(
      segments
        .filter(segment => !segment.removed)
        .map(segment => segment.text)
        .join(''),
    ).toBe(posted.text)
    expect(
      [...indices].every(index => ['\\', '<', '>'].includes(text[index])),
    ).toBe(true)
    expect(rt.text).toBe(text)
  })

  it('dims masked destination escapes and angle delimiters at the correct Unicode offsets', () => {
    const text = '🌟 [page](<https://example.com/a\\(b\\)>)'
    const rt = new RichText({text})
    rt.detectFacetsWithoutResolution()
    const indices = getFacetSyntaxRemovalIndices(rt)
    const segments = splitFacetSyntax(text.slice(3), 3, indices)

    expect(
      segments.filter(segment => segment.removed).map(segment => segment.text),
    ).toEqual(['<', '\\', '\\', '>'])
    expect(segments.map(segment => segment.text).join('')).toBe(text.slice(3))
    expect(parseMarkdownLinks(text).facets[0].features[0]).toMatchObject({
      uri: 'https://example.com/a(b)',
    })
  })

  it('highlights complete editor destinations while leaving both angle brackets plain', () => {
    const uri = 'https://breezewiki.com/starwars/wiki/67_(disambiguation)'
    const text = `🌟 [this](<${uri}>) is a [test](<${uri}>)`
    const rt = new RichText({text})
    rt.detectFacetsWithoutResolution()
    applyMarkdownLinkFacets(rt)
    applyFacetSyntax(rt)

    expect(rt.text).toBe(text)
    expect(facetTexts(rt)).toEqual(['[this](', uri, ')', '[test](', uri, ')'])
    expect(rt.facets?.flatMap(facet => facet.features)).toEqual(
      Array.from({length: 6}, () => ({
        $type: 'app.bsky.richtext.facet#link',
        uri,
      })),
    )
    expect(
      Array.from(rt.segments())
        .filter(segment => !segment.facet)
        .map(segment => segment.text),
    ).toEqual(['🌟 ', '<', '>', ' is a ', '<', '>'])
  })

  it.each([
    'https://breezewiki.com/starwars/wiki/67_(disambiguation)',
    '<https://breezewiki.com/starwars/wiki/67_(disambiguation)>',
    'https://breezewiki.com/starwars/wiki/67_\\(disambiguation\\)',
    '<https://breezewiki.com/starwars/wiki/67\\_(disambiguation)>',
  ])('preserves parentheses in a masked destination: %s', destination => {
    const rt = prepare(`🌟 [page](${destination}) and [next](example.com)`)

    expect(rt.text).toBe('🌟 page and next')
    expect(facetTexts(rt)).toEqual(['page', 'next'])
    expect(rt.facets?.map(facet => facet.index)).toEqual([
      {byteStart: 5, byteEnd: 9},
      {byteStart: 14, byteEnd: 18},
    ])
    expect(rt.facets?.[0].features[0]).toMatchObject({
      uri: 'https://breezewiki.com/starwars/wiki/67_(disambiguation)',
    })
  })

  it('allows unbalanced and nested parentheses inside angle destinations', () => {
    const uri = 'https://example.com/a(b(c)d'
    const rt = prepare(`[page](<${uri}>)`)

    expect(rt.text).toBe('page')
    expect(rt.facets?.[0].features[0]).toMatchObject({uri})
  })

  it('keeps the editor support for spaces before a masked destination', () => {
    const rt = prepare('[page] (<https://example.com/a(b)>)')

    expect(rt.text).toBe('page')
    expect(rt.facets?.[0].features[0]).toMatchObject({
      uri: 'https://example.com/a(b)',
    })
  })

  it('does not truncate an incomplete masked destination at an inner parenthesis', () => {
    const text = '[page](https://example.com/a(b)'
    expect(parseMarkdownLinks(text)).toEqual({text, facets: []})
  })

  it.each(['https://example.com/a(b)', '\\<https://example.com/a(b)>'])(
    'escapes the complete masked destination: %s',
    destination => {
      const rt = prepare(`\\[page](${destination}) https://outside.example.com`)

      expect(rt.text).toBe(
        `[page](${destination.replace('\\<', '<')}) https://outside.example.com`,
      )
      expect(facetTexts(rt)).toEqual(['https://outside.example.com'])
    },
  )

  it.each(['', ' '])(
    'preserves an independent angle link in an escaped wrapper, padded with %j',
    padding => {
      const uri = 'https://breezewiki.com/starwars/wiki/67_(disambiguation)'
      const input = `🌟 \\[${uri}](<${padding}${uri}${padding}>)`
      const editor = new RichText({text: input})
      editor.detectFacetsWithoutResolution()
      const indices = getFacetSyntaxRemovalIndices(editor)
      expect([...indices].map(index => input[index]).sort()).toEqual(
        ['<', '>', '\\'].sort(),
      )
      const rt = prepare(input)

      expect(rt.text).toBe(`🌟 [${uri}](${padding}${uri}${padding})`)
      expect(facetTexts(rt)).toEqual([uri])
      expect(rt.facets?.[0].features[0]).toMatchObject({uri})
    },
  )

  it('escapes a spaced angle link at its own opening delimiter', () => {
    const rt = prepare('\\[page](\\< https://example.com/a(b) >)')

    expect(rt.text).toBe('[page](< https://example.com/a(b) >)')
    expect(facetTexts(rt)).toEqual([])
  })

  it('trims padding inside an active masked destination', () => {
    const rt = prepare('[page](< https://example.com/a(b) >)')

    expect(rt.text).toBe('page')
    expect(rt.facets?.[0].features[0]).toMatchObject({
      uri: 'https://example.com/a(b)',
    })
  })

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

describe('formatting and facet syntax integration', () => {
  it.each([
    String.raw`\\*literal* \<example.com> ||hello 123||`,
    String.raw`\\\*literal* <example.com> ||hello 123||`,
    String.raw`\*literal* \\example.com ||hello 123||`,
  ])('unescapes each original slash at most once: %s', text => {
    const rt = new RichText({text})
    rt.detectFacetsWithoutResolution()
    const indices = getFacetSyntaxRemovalIndices(rt)
    const expected = [...text]
      .filter((_, index) => !indices.has(index))
      .join('')
    applyFacetSyntax(rt, {removeSyntax: true})
    expect(rt.text).toBe(expected.replace('hello 123', shift('hello 123')))
    const first = rt.text
    applyFacetSyntax(rt, {removeSyntax: true})
    expect(rt.text).toBe(first)
  })

  it('never transforms Markdown links, angles or escapes inside code fences', () => {
    const text = '```js\n[page](example.com) <#tag> \\\\word **bold**\n```'
    expect(parseMarkdownLinks(text)).toEqual({text, facets: []})
    expect(prepare(text).text).toBe(text)
    expect(prepare(text).facets ?? []).toEqual([])
    const inline = '`[page](example.com) <#tag> \\\\word`'
    const rt = prepare(inline)
    expect(rt.text).toBe(inline)
    expect(rt.facets?.flatMap(f => f.features).map(kindOf)).toEqual(['code'])
  })

  it('suppresses links, mentions and tags inside spoilers but preserves their text', () => {
    const text = '||@person.test #tag example.com||'
    const rt = prepare(text)
    expect(rt.text).toBe(`||${shift(text.slice(2, -2))}||`)
    expect(rt.facets?.flatMap(f => f.features).map(kindOf)).toEqual(['spoiler'])
    expect(
      piecesOf(rt.text, rt.facets)
        .map(p => p.text)
        .join(''),
    ).toBe(text.slice(2, -2))
  })

  it('keeps Unicode overlapping formatting and following emoji ranges while shortening', () => {
    const source = '🌟 **https://example.com/éééééééééééééééééééé** :wave:'
    const rt = prepare(source)
    const emojiStart = rt.unicodeText.utf16IndexToUtf8Index(
      rt.text.indexOf(':wave:'),
    )
    rt.facets!.push({
      index: {byteStart: emojiStart, byteEnd: emojiStart + 6},
      features: [
        {
          $type: 'blue.moji.richtext.facet',
          did: 'did:plc:emoji',
        } as unknown as Unknown$TypedObject,
      ],
    })
    const shortened = shortenLinks(rt, true)
    const formatting = shortened.facets!.find(f =>
      f.features.some(f => kindOf(f) === 'bold'),
    )!
    const link = shortened.facets!.find(f =>
      f.features.some(f => f.$type === 'app.bsky.richtext.facet#link'),
    )!
    expect(formatting.index).toEqual(link.index)
    expect(
      shortened.unicodeText.slice(
        formatting.index.byteStart,
        formatting.index.byteEnd,
      ),
    ).toBe(
      shortened.text.slice(
        shortened.text.indexOf('**') + 2,
        shortened.text.lastIndexOf('**'),
      ),
    )
    const emoji = shortened.facets!.find(f =>
      f.features.some(f => f.$type === 'blue.moji.richtext.facet'),
    )!
    expect(
      shortened.unicodeText.slice(emoji.index.byteStart, emoji.index.byteEnd),
    ).toBe(':wave:')
    expect(
      piecesOf(shortened.text, shortened.facets)
        .map(p => p.text)
        .join(''),
    ).not.toContain('**')
  })

  it('retains explicit full URL label identities while adding formatting facets', () => {
    const uri = 'https://example.com/a-very-long-path-that-must-stay-explicit'
    const parsed = parseMarkdownLinks(`**[${uri}](${uri})**`)
    const rt = new RichText({
      text: parsed.text,
      facets: parsed.facets as NonNullable<RichText['facets']>,
    })
    applyFacetSyntax(rt, {removeSyntax: true})
    const shortened = shortenLinks(rt, true, parsed.facets)
    expect(shortened.text).toBe(`**${uri}**`)
    expect(
      shortened.facets?.some(f =>
        f.features.some(feature => feature.$type === featureOf('bold').$type),
      ),
    ).toBe(true)
  })
})

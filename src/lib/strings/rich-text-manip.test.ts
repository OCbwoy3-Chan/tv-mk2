import {RichText} from '@bsky/sdk/richtext'

import {parseMarkdownLinks, stripAngleBracketedFacets} from './rich-text-manip'

describe('stripAngleBracketedFacets', () => {
  it('removes links and mentions enclosed in angle brackets', () => {
    const text =
      '🌟 < https://inside.example.com > https://outside.example.com < @inside.test > @outside.test'
    const rt = new RichText({text})
    rt.detectFacetsWithoutResolution()
    const detected = rt.facets?.map(facet =>
      rt.unicodeText.slice(facet.index.byteStart, facet.index.byteEnd),
    )
    expect(detected).toContain('https://inside.example.com')
    expect(detected).toContain('@inside.test')

    stripAngleBracketedFacets(rt)

    expect(rt.text).toBe(text)
    expect(
      rt.facets?.map(facet =>
        rt.unicodeText.slice(facet.index.byteStart, facet.index.byteEnd),
      ),
    ).toEqual(['https://outside.example.com', '@outside.test'])
  })

  it('removes a facet directly between brackets but keeps tag facets', () => {
    const rt = new RichText({
      text: '<example.com> #topic',
      facets: [
        {
          index: {byteStart: 1, byteEnd: 12},
          features: [
            {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
          ],
        },
        {
          index: {byteStart: 14, byteEnd: 20},
          features: [{$type: 'app.bsky.richtext.facet#tag', tag: 'topic'}],
        },
      ],
    })

    stripAngleBracketedFacets(rt)

    expect(rt.facets?.map(facet => facet.features[0].$type)).toEqual([
      'app.bsky.richtext.facet#tag',
    ])
  })

  it('removes the brackets when publishing while preserving other facet offsets', () => {
    const rt = new RichText({
      text: '🌟 <https://inside.example.com> <@inside.test> https://outside.example.com <plain>',
    })
    rt.detectFacetsWithoutResolution()

    stripAngleBracketedFacets(rt, {removeBrackets: true})

    expect(rt.text).toBe(
      '🌟 https://inside.example.com @inside.test https://outside.example.com <plain>',
    )
    expect(
      rt.facets?.map(facet =>
        rt.unicodeText.slice(facet.index.byteStart, facet.index.byteEnd),
      ),
    ).toEqual(['https://outside.example.com'])
  })

  it('removes parsed markdown links inside angle brackets', () => {
    const parsed = parseMarkdownLinks('<[label](https://example.com)>')
    const rt = new RichText({text: parsed.text})
    rt.facets = [
      {
        index: parsed.facets[0].index,
        features: [
          {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
        ],
      },
    ]

    stripAngleBracketedFacets(rt, {removeBrackets: true})

    expect(rt.text).toBe('label')
    expect(rt.facets).toEqual([])
  })
})

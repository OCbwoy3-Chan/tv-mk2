import {type AppBskyRichtextFacet} from '@atproto/api'
import {RichText, UnicodeString} from '@bsky/sdk/richtext'

import {
  applyFormattingFacets,
  featureOf,
  formattingIn,
  type Kind,
  kindOf,
  piecesOf,
  shift,
} from './formatting'

function facet(
  text: string,
  value: string,
  kind: Kind,
): AppBskyRichtextFacet.Main {
  const start = text.indexOf(value)
  const unicode = new UnicodeString(text)
  return {
    index: {
      byteStart: unicode.utf16IndexToUtf8Index(start),
      byteEnd: unicode.utf16IndexToUtf8Index(start + value.length),
    },
    features: [featureOf(kind)],
  }
}

describe('Parfait formatting syntax', () => {
  it.each([
    '2*3*4',
    '*nix',
    'snake_case',
    '** spaced **',
    '*two\nlines*',
    '\\**literal**',
  ])('leaves literal boundaries alone: %s', text => {
    expect(formattingIn(text).formats).toEqual([])
  })

  it('supports nested spans while rejecting crossing spans', () => {
    const text = '**bold *italic* and ~~struck~~**'
    expect(
      formattingIn(text).formats.map(format => [
        format.kind,
        text.slice(format.start, format.end),
      ]),
    ).toEqual([
      ['bold', 'bold *italic* and ~~struck~~'],
      ['italic', 'italic'],
      ['strikethrough', 'struck'],
    ])
    expect(
      formattingIn('**bold *cross** outside*').formats.map(f => f.kind),
    ).toEqual(['bold'])
  })

  it('leaves code and fences literal and suppresses their linked spans', () => {
    const text = '`**literal** example.com`\n```JS\n*literal* @person.test\n```'
    const linked = [
      {
        start: text.indexOf('example.com'),
        end: text.indexOf('example.com') + 11,
      },
    ]
    const result = formattingIn(text, linked)
    expect(result.formats.map(f => f.kind)).toEqual(['code'])
    expect(result.linked).toEqual([])
    expect(result.blocks[0].language).toBe('js')
    expect(result.blocks[0].code).toBe('*literal* @person.test')
    expect(result.escapes).toEqual([])
  })

  it('keeps links whole and suppresses links, mentions and tags in spoilers', () => {
    const text = '**example.com** || @person.test #tag example.org ||'
    const spans = ['example.com', '@person.test', '#tag', 'example.org'].map(
      value => ({
        start: text.indexOf(value),
        end: text.indexOf(value) + value.length,
      }),
    )
    expect(formattingIn(text, spans).linked).toEqual([spans[0]])
    expect(formattingIn(text, spans).formats.map(f => f.kind)).toEqual([
      'bold',
      'spoiler',
    ])
    expect(
      formattingIn('https://example.com/a_b_c', [{start: 0, end: 27}]).formats,
    ).toEqual([])
  })

  it('collects each escaped backslash once and never unescapes code', () => {
    const text = '\\*literal* \\\\ **bold** `\\*code*`'
    const result = formattingIn(text)
    expect(result.escapes).toEqual([0, text.indexOf('\\\\')])
    expect(result.formats.map(f => f.kind)).toEqual(['bold', 'code'])
  })
})

describe('formatting facets', () => {
  it('recognizes only exact supported namespace features', () => {
    expect(kindOf(featureOf('bold'))).toBe('bold')
    for (const $type of [
      'social.parfait.richtext.facet#unknown',
      'evil.social.parfait.richtext.facet#bold',
      'social.parfait.richtext.facet#bold.extra',
    ]) {
      expect(kindOf({$type})).toBeUndefined()
    }
    expect(kindOf(undefined)).toBeUndefined()
    expect(kindOf({$type: 123} as never)).toBeUndefined()
  })

  it('uses valid UTF-8 boundaries and segments overlapping features once', () => {
    const text = '🌟 **hé [世]**!'
    const bold = facet(text, 'hé [世]', 'bold')
    const link = facet(text, '世', 'italic')
    link.features = [
      {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
    ]
    const pieces = piecesOf(text, [bold, link])
    expect(pieces.map(piece => piece.text).join('')).toBe('🌟 hé [世]!')
    const linked = pieces.find(piece => piece.text === '世')!
    expect(linked.start).toBe(text.indexOf('世'))
    expect(linked.kinds).toEqual(['bold'])
    expect(linked.features).toEqual([...bold.features, ...link.features])
  })

  it('falls back literally for malformed byte ranges and unknown features', () => {
    const text = '🌟 **word**'
    const invalid = [
      {index: {byteStart: 1, byteEnd: 9}, features: [featureOf('bold')]},
      {index: {byteStart: -1, byteEnd: 10}, features: [featureOf('spoiler')]},
      {index: {byteStart: 7, byteEnd: 100}, features: [featureOf('code')]},
    ]
    expect(
      piecesOf(text, invalid)
        .map(p => p.text)
        .join(''),
    ).toBe(text)
    const unknown = facet(text, 'word', 'bold')
    unknown.features = [{$type: 'social.parfait.richtext.facet#unsupported'}]
    expect(
      piecesOf(text, [unknown])
        .map(p => p.text)
        .join(''),
    ).toBe(text)
  })

  it('does not hide unmatched markers or require markers on foreign facets', () => {
    const text = '**word!'
    expect(
      piecesOf(text, [facet(text, 'word', 'bold')])
        .map(p => p.text)
        .join(''),
    ).toBe(text)
    expect(piecesOf('word', [facet('word', 'word', 'bold')])).toMatchObject([
      {text: 'word', kinds: ['bold']},
    ])
  })

  it('decodes each overlapping spoiler once and groups all of its pieces', () => {
    const text = '||uryyb 678|| ||jbeyq||'
    const first = facet(text, 'uryyb 678', 'spoiler')
    const second = facet(text, 'jbeyq', 'spoiler')
    const bold = facet(text, 'uryyb', 'bold')
    const pieces = piecesOf(text, [first, second, bold])
    expect(pieces.map(p => p.text).join('')).toBe('hello 123 world')
    expect(
      pieces
        .filter(p => p.spoiler === 0)
        .map(p => p.text)
        .join(''),
    ).toBe('hello 123')
    expect(
      pieces
        .filter(p => p.spoiler === 1)
        .map(p => p.text)
        .join(''),
    ).toBe('world')
    expect(shift(shift('Héllo 123 🌟'))).toBe('Héllo 123 🌟')
  })

  it('leaves previews untouched and posts spoilers and escapes only once', () => {
    const source = '🌟 \\*literal* ||hello 123 世||'
    const rt = new RichText({text: source})
    applyFormattingFacets(rt)
    applyFormattingFacets(rt)
    expect(rt.text).toBe(source)
    expect(rt.facets).toHaveLength(1)
    applyFormattingFacets(rt, {forPosting: true})
    const facets = rt.facets
    expect(rt.text).toBe('🌟 *literal* ||uryyb 678 世||')
    expect(
      piecesOf(rt.text, rt.facets)
        .map(p => p.text)
        .join(''),
    ).toBe('🌟 *literal* hello 123 世')
    applyFormattingFacets(rt, {forPosting: true})
    expect(rt.text).toBe('🌟 *literal* ||uryyb 678 世||')
    expect(rt.facets).toBe(facets)
  })
})

it('trims swallowed closing markers only when the opening marker precedes a linked span', () => {
  const text = '||@person.test #tag example.com||'
  const start = text.indexOf('example.com')
  const parsed = formattingIn(text, [{start, end: text.length}])
  expect(parsed.formats.map(format => format.kind)).toEqual(['spoiler'])
  expect(parsed.linked).toEqual([])

  const url = 'https://example.com/a**real**'
  const linked = [{start: 0, end: url.length}]
  expect(formattingIn(url, linked).linked).toEqual(linked)
  expect(formattingIn(url, linked).formats).toEqual([])
})

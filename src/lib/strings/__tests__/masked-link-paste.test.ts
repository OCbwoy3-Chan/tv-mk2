import {maskPastedLink} from '../masked-link-paste'

describe('maskPastedLink', () => {
  it('keeps a selected label when replaced by a URL', () => {
    expect(
      maskPastedLink('See this site!', 'See https://example.com!', {
        start: 4,
        end: 13,
      }),
    ).toBe('See [this site](https://example.com)!')
  })

  it('handles a URL shorter than a Unicode label', () => {
    const label = '🌟 a very long selected label'
    expect(
      maskPastedLink(label, 'example.com', {start: 0, end: label.length}),
    ).toBe(`[${label}](example.com)`)
  })

  it.each([
    'replacement text',
    '',
    'javascript://example.com',
    '<https://example.com>',
  ])('leaves ordinary or unsupported replacements alone: %s', next => {
    expect(maskPastedLink('label', next, {start: 0, end: 5})).toBe(next)
  })

  it.each([
    'https://breezewiki.com/starwars/wiki/67_(disambiguation)',
    'https://example.com/a(b(c)d',
  ])('protects a pasted URL containing parentheses: %s', uri => {
    expect(maskPastedLink('page', uri, {start: 0, end: 4})).toBe(
      `[page](<${uri}>)`,
    )
  })

  it('leaves insertion without a selection alone', () => {
    expect(maskPastedLink('', 'https://example.com', {start: 0, end: 0})).toBe(
      'https://example.com',
    )
  })
})

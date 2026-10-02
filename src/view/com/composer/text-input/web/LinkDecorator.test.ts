import {Schema} from '@tiptap/pm/model'

import {getLinkDecorations} from '#/view/com/composer/text-input/web/LinkDecorator'

const schema = new Schema({
  nodes: {doc: {content: 'text*'}, text: {}},
})

describe('post editor link highlighting', () => {
  it.each(
    ['like.so', 'like.so/path', 'https://example.com/path'].flatMap(uri =>
      ['!', '?', '?!', '.)*', '!)*', ', next'].map(suffix => [uri, suffix]),
    ),
  )(
    'leaves punctuation after a masked link plain: %s followed by %s',
    (uri, suffix) => {
      const masked = `[with masked links](${uri})`
      const text = `(*text ${masked}${suffix}`
      const doc = schema.node('doc', null, schema.text(text))
      const decorations = getLinkDecorations(doc).find()
      const linkEnd = text.indexOf(masked) + masked.length

      expect(
        decorations.some(range => range.from < linkEnd && range.to === linkEnd),
      ).toBe(true)
      expect(decorations.every(range => range.to <= linkEnd)).toBe(true)
    },
  )

  it('highlights the complete URLs in the screenshot while leaving both angle brackets plain', () => {
    const uri = 'https://breezewiki.com/starwars/wiki/67_(disambiguation)'
    const text = `[this](<${uri}>) is a [test](<${uri}>)`
    const doc = schema.node('doc', null, schema.text(text))
    const decorations = getLinkDecorations(doc)
      .find()
      .filter(
        decoration =>
          !(decoration.spec as {removedSyntax?: boolean}).removedSyntax,
      )
    const highlighted = (index: number) =>
      decorations.some(range => index >= range.from && index < range.to)

    for (let index = 0; index < text.length; index++) {
      if (text[index] === '<' || text[index] === '>') {
        expect(highlighted(index)).toBe(false)
      }
    }
    for (const match of text.matchAll(/https:[^>]+/g)) {
      for (
        let index = match.index;
        index < match.index + match[0].length;
        index++
      ) {
        expect(highlighted(index)).toBe(true)
      }
    }
  })

  it('leaves an escaped masked link entirely plain', () => {
    const doc = schema.node(
      'doc',
      null,
      schema.text('\\[page](\\<https://example.com/a(b)>)'),
    )
    const decorations = getLinkDecorations(doc).find()
    expect(decorations).toHaveLength(2)
    expect(decorations[0]).toMatchObject({from: 0, to: 1})
    expect(decorations[0].spec).toEqual({removedSyntax: true})
  })

  it.each(['', ' '])(
    'highlights an independent angle URL inside an escaped wrapper, padded with %j',
    padding => {
      const uri = 'https://breezewiki.com/starwars/wiki/67_(disambiguation)'
      const text = `\\[${uri}](<${padding}${uri}${padding}>)`
      const doc = schema.node('doc', null, schema.text(text))
      const decorations = getLinkDecorations(doc).find()
      const links = decorations.filter(
        decoration =>
          !(decoration.spec as {removedSyntax?: boolean}).removedSyntax,
      )
      const destinationStart = text.lastIndexOf(uri)
      const labelStart = text.indexOf(uri)

      for (
        let index = destinationStart;
        index < destinationStart + uri.length;
        index++
      ) {
        expect(
          links.some(range => index >= range.from && index < range.to),
        ).toBe(true)
      }
      expect(
        links.some(range => labelStart >= range.from && labelStart < range.to),
      ).toBe(false)
      const dimmed = decorations.filter(
        decoration =>
          (decoration.spec as {removedSyntax?: boolean}).removedSyntax,
      )
      expect(dimmed.map(range => text.slice(range.from, range.to))).toEqual([
        '\\',
        '<',
        '>',
      ])
    },
  )

  it('leaves a separately escaped spaced angle link unhighlighted', () => {
    const text = '\\< https://example.com/a(b) >'
    const doc = schema.node('doc', null, schema.text(text))
    const decorations = getLinkDecorations(doc).find()
    expect(decorations).toHaveLength(1)
    expect(decorations[0].spec).toEqual({removedSyntax: true})
  })

  it('dims both angle delimiters and an escaping backslash without changing the text', () => {
    const text = '🌟 <example.com> \\#topic'
    const doc = schema.node('doc', null, schema.text(text))
    const dimmed = getLinkDecorations(doc)
      .find()
      .filter(
        decoration =>
          (decoration.spec as {removedSyntax?: boolean}).removedSyntax,
      )

    expect(dimmed.map(range => text.slice(range.from, range.to))).toEqual([
      '<',
      '>',
      '\\',
    ])
    expect(doc.textContent).toBe(text)
  })

  it('keeps literal angle brackets and backslashes at full opacity', () => {
    const text = '<ordinary text> \\ordinary'
    const doc = schema.node('doc', null, schema.text(text))
    expect(getLinkDecorations(doc).find()).toEqual([])
  })
})

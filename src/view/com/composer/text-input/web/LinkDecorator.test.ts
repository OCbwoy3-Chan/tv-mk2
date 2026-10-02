import {Schema} from '@tiptap/pm/model'

import {getLinkDecorations} from '#/view/com/composer/text-input/web/LinkDecorator'

const schema = new Schema({
  nodes: {doc: {content: 'text*'}, text: {}},
})

describe('post editor link highlighting', () => {
  it('highlights the complete URLs in the screenshot while leaving both angle brackets plain', () => {
    const uri = 'https://breezewiki.com/starwars/wiki/67_(disambiguation)'
    const text = `[this](<${uri}>) is a [test](<${uri}>)`
    const doc = schema.node('doc', null, schema.text(text))
    const decorations = getLinkDecorations(doc).find()
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
      schema.text('\\[page](<https://example.com/a(b)>)'),
    )
    expect(getLinkDecorations(doc).find()).toEqual([])
  })
})

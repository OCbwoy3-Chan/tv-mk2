import {Schema} from '@tiptap/pm/model'

import {getFormattingDecorations} from '#/view/com/composer/text-input/web/FormattingDecorator'

const schema = new Schema({
  nodes: {
    doc: {content: 'paragraph+'},
    paragraph: {content: 'inline*', group: 'block'},
    text: {group: 'inline'},
    mention: {inline: true, group: 'inline', atom: true, attrs: {id: {}}},
    bluemoji: {inline: true, group: 'inline', atom: true, attrs: {alias: {}}},
    hardBreak: {inline: true, group: 'inline'},
  },
})

function paragraph(text: string) {
  return schema.node('paragraph', null, text ? schema.text(text) : undefined)
}

it('styles nested Unicode words, keeping editable delimiters outside the styled words', () => {
  const text = '🌟 **bold *café* words**'
  const doc = schema.node('doc', null, paragraph(text))
  const ranges = getFormattingDecorations(doc).find()
  expect(ranges.some(range => range.from === 6 && range.to === 23)).toBe(true)
  expect(ranges.some(range => range.from === 12 && range.to === 16)).toBe(true)
})

it('maps raw aliases and mention atoms back to editable document positions', () => {
  const block = schema.node('paragraph', null, [
    schema.text('**'),
    schema.node('mention', {id: 'alice.test'}),
    schema.text(' '),
    schema.node('bluemoji', {alias: ':party:'}),
    schema.text(' words**'),
  ])
  const doc = schema.node('doc', null, block)
  const ranges = getFormattingDecorations(doc).find()
  expect(ranges.some(range => range.from === 3 && range.to === 12)).toBe(true)
})

it('retains empty lines and hard-break offsets when decorating later paragraphs', () => {
  const doc = schema.node('doc', null, [
    paragraph(''),
    schema.node('paragraph', null, [
      schema.text('before'),
      schema.node('hardBreak'),
      schema.text('~~after~~'),
    ]),
  ])
  const ranges = getFormattingDecorations(doc).find()
  expect(ranges.some(range => range.from === 12 && range.to === 17)).toBe(true)
})

it.each(['snake_case', '2*3*4', '\\**literal**', '`**code**`'])(
  'does not interpret literal text as bold: %s',
  text => {
    const doc = schema.node('doc', null, paragraph(text))
    const ranges = getFormattingDecorations(doc).find()
    if (text === '`**code**`') {
      expect(
        ranges
          .map(range => [range.from, range.to])
          .sort(([left], [right]) => left - right),
      ).toEqual([
        [1, 2],
        [2, 10],
        [10, 11],
      ])
    } else if (text.startsWith('\\')) {
      expect(ranges.map(range => [range.from, range.to])).toEqual([[1, 2]])
    } else {
      expect(ranges).toEqual([])
    }
  },
)

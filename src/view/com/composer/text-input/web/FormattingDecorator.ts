import {RichText} from '@bsky/sdk/richtext'
import {Extension} from '@tiptap/core'
import {type Node} from '@tiptap/pm/model'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

import {formattingIn, kindOf} from '#/lib/strings/formatting'
import {
  applyFacetSyntax,
  applyMarkdownLinkFacets,
} from '#/lib/strings/rich-text-manip'

/** Style source Markdown without changing editable text or cursor positions. */
export function getFormattingDecorations(doc: Node) {
  let text = ''
  const starts: number[] = []
  const ends: number[] = []
  let firstBlock = true
  doc.descendants((block, blockPos) => {
    if (!block.isTextblock) return true
    if (!firstBlock) {
      text += '\n'
      starts.push(blockPos)
      ends.push(blockPos + 1)
    }
    firstBlock = false
    block.forEach((node, offset) => {
      const pos = blockPos + 1 + offset
      const source = node.isText
        ? node.textContent
        : node.type.name === 'bluemoji'
          ? String(node.attrs.alias)
          : node.type.name === 'mention'
            ? `@${String(node.attrs.id)}`
            : node.type.name === 'hardBreak'
              ? '\n'
              : '\uFFFC'
      for (let index = 0; index < source.length; index++) {
        starts.push(node.isText ? pos + index : pos)
        ends.push(node.isText ? pos + index + 1 : pos + node.nodeSize)
      }
      text += source
    })
    return false
  })
  const rt = new RichText({text})
  rt.detectFacetsWithoutResolution()
  applyMarkdownLinkFacets(rt)
  applyFacetSyntax(rt)
  const linked = (rt.facets ?? [])
    .filter(facet => facet.features.some(feature => !kindOf(feature)))
    .map(facet => ({
      start: rt.unicodeText.slice(0, facet.index.byteStart).length,
      end: rt.unicodeText.slice(0, facet.index.byteEnd).length,
    }))
  const {formats, escapes, blocks} = formattingIn(text, linked)
  const decorations: Decoration[] = []
  const add = (start: number, end: number, className: string) => {
    if (
      start < end &&
      starts[start] !== undefined &&
      ends[end - 1] !== undefined
    )
      decorations.push(
        Decoration.inline(starts[start], ends[end - 1], {class: className}),
      )
  }
  for (const format of formats) {
    add(format.start, format.end, `composer-format-${format.kind}`)
    add(format.start - format.marker, format.start, 'composer-syntax')
    add(format.end, format.end + format.marker, 'composer-syntax')
  }
  for (const index of escapes) add(index, index + 1, 'composer-syntax')
  for (const block of blocks)
    add(block.start, block.end, 'composer-format-code')
  return DecorationSet.create(doc, decorations)
}

export const FormattingDecorator = Extension.create({
  name: 'formatting-decorator',
  addProseMirrorPlugins() {
    const plugin: Plugin<DecorationSet> = new Plugin({
      key: new PluginKey('formatting-decorator'),
      state: {
        init: (_, {doc}) => getFormattingDecorations(doc),
        apply: (transaction, previous) =>
          transaction.docChanged
            ? getFormattingDecorations(transaction.doc)
            : previous.map(transaction.mapping, transaction.doc),
      },
      props: {decorations: state => plugin.getState(state)},
    })
    return [plugin]
  },
})

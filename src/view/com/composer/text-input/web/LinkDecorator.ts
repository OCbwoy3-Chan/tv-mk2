/**
 * TipTap is a stateful rich-text editor, which is extremely useful
 * when you _want_ it to be stateful formatting such as bold and italics.
 *
 * However we also use "stateless" behaviors, specifically for URLs
 * where the text itself drives the formatting.
 *
 * This plugin uses a regex to detect URIs and then applies
 * link decorations (a <span> with the "autolink") class. That avoids
 * adding any stateful formatting to TipTap's document model.
 *
 * We then run the URI detection again when constructing the
 * RichText object from TipTap's output and merge their features into
 * the facet-set.
 */

import {RichText, UnicodeString, URL_REGEX} from '@bsky/sdk/richtext'
import {Mark} from '@tiptap/core'
import {type Node as ProsemirrorNode} from '@tiptap/pm/model'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

import {
  getMarkdownLinkHighlightRanges,
  MARKDOWN_LINK_PATTERN,
} from '#/lib/strings/markdown-links'
import {
  getEnclosedFacet,
  getFacetSyntaxRemovalIndices,
  isEscapedFacetSyntax,
  isInsideEscapedFacetSyntax,
} from '#/lib/strings/rich-text-manip'
import {isValidDomain} from '#/lib/strings/url-helpers'

export const LinkDecorator = Mark.create({
  name: 'link-decorator',
  priority: 1000,
  keepOnSplit: false,
  inclusive() {
    return true
  },
  addProseMirrorPlugins() {
    return [linkDecorator()]
  },
})

/** Link highlights and dimmed syntax in the web post editor. */
export function getLinkDecorations(doc: ProsemirrorNode) {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const textContent = node.textContent
      const maskedRanges: {from: number; to: number}[] = []
      const richtext = new RichText({text: textContent})
      richtext.detectFacetsWithoutResolution()
      for (const index of getFacetSyntaxRemovalIndices(richtext)) {
        decorations.push(
          Decoration.inline(
            pos + index,
            pos + index + 1,
            {class: 'composer-syntax'},
            {removedSyntax: true},
          ),
        )
      }

      // markdown links [text](url)
      const markdownRegex = new RegExp(MARKDOWN_LINK_PATTERN)
      let markdownMatch
      while ((markdownMatch = markdownRegex.exec(textContent)) !== null) {
        if (isEscapedFacetSyntax(textContent, markdownMatch.index)) continue
        maskedRanges.push({
          from: markdownMatch.index,
          to: markdownMatch.index + markdownMatch[0].length,
        })
        for (const range of getMarkdownLinkHighlightRanges(
          markdownMatch[0],
          markdownMatch[1],
        )) {
          decorations.push(
            Decoration.inline(
              pos + markdownMatch.index + range.start,
              pos + markdownMatch.index + range.end,
              {class: 'autolink'},
            ),
          )
        }
      }

      for (const match of textContent.matchAll(/<([^<>\n]+)>/g)) {
        if (
          isEscapedFacetSyntax(textContent, match.index) ||
          isInsideEscapedFacetSyntax(
            textContent,
            match.index,
            match.index + match[0].length,
          )
        ) {
          continue
        }

        const content = match[1]
        const trimmed = content.trim()
        const facet = getEnclosedFacet(trimmed)
        if (!facet) continue

        const contentStart = match.index + 1 + content.indexOf(trimmed)
        const unicode = new UnicodeString(trimmed)
        const from =
          contentStart + unicode.slice(0, facet.index.byteStart).length
        const to = contentStart + unicode.slice(0, facet.index.byteEnd).length
        decorations.push(
          Decoration.inline(pos + from, pos + to, {
            class: 'autolink',
          }),
        )
      }

      // regular links
      iterateUris(textContent, (from, to) => {
        /*
         * Automatic URLs can swallow the closing parenthesis and punctuation.
         * The explicit masked link already supplies the correct highlight.
         */
        if (maskedRanges.some(range => from < range.to && to > range.from)) {
          return
        }
        if (isInsideEscapedFacetSyntax(textContent, from, to)) return
        decorations.push(
          Decoration.inline(pos + from, pos + to, {
            class: 'autolink',
          }),
        )
      })
    }
  })

  return DecorationSet.create(doc, decorations)
}

function linkDecorator() {
  const linkDecoratorPlugin: Plugin = new Plugin({
    key: new PluginKey('link-decorator'),

    state: {
      init: (_, {doc}) => getLinkDecorations(doc),
      apply: (transaction, decorationSet) => {
        if (transaction.docChanged) {
          return getLinkDecorations(transaction.doc)
        }
        return decorationSet.map(transaction.mapping, transaction.doc)
      },
    },

    props: {
      decorations(state) {
        return linkDecoratorPlugin.getState(state)
      },
    },
  })
  return linkDecoratorPlugin
}

function iterateUris(str: string, cb: (from: number, to: number) => void) {
  let match
  const re = new RegExp(URL_REGEX)
  while ((match = re.exec(str))) {
    let uri = match[2]
    if (!uri.startsWith('http')) {
      const domain = match.groups?.domain
      if (!domain || !isValidDomain(domain)) {
        continue
      }
      uri = `https://${uri}`
    }
    let from = str.indexOf(match[2], match.index)
    let to = from + match[2].length
    // strip ending puncuation
    if (/[.,;!?]$/.test(uri)) {
      uri = uri.slice(0, -1)
      to--
    }
    if (/[)]$/.test(uri) && !uri.includes('(')) {
      uri = uri.slice(0, -1)
      to--
    }
    cb(from, to)
  }
}

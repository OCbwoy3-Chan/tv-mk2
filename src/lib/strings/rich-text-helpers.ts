import {AppBskyRichtextFacet} from '@atproto/api'
import {RichText} from '@bsky/sdk/richtext'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {getEnclosedLinkOrMention} from './rich-text-manip'
import {linkRequiresWarning, toShortUrl} from './url-helpers'

export function richTextToString(rt: RichText, loose: boolean): string {
  const {text, facets} = rt

  if (!facets?.length) {
    return text
  }

  let result = ''

  for (const segment of rt.segments()) {
    const link = segment.link

    if (link && bsky.matches(app.bsky.richtext.facet.link, link)) {
      const href = link.uri
      const text = segment.text

      const requiresWarning = linkRequiresWarning(href, text)

      result += !requiresWarning ? href : loose ? `[${text}](${href})` : text
    } else {
      result += segment.text
    }
  }

  return result
}

/**
 * Serializes rich text into markdown-link syntax without changing a link's
 * visible label. This preserves even same-domain labels instead of replacing
 * them with the destination URL.
 */
export function richTextToStringPreservingLinks(rt: RichText): string {
  return serializeRichTextPreservingLinks(rt, false)
}

/** Keep link facets and escape plain text that would gain a facet on repost. */
export function richTextToRedraftString(rt: RichText): string {
  return serializeRichTextPreservingLinks(rt, true)
}

function serializeRichTextPreservingLinks(
  rt: RichText,
  escapeUnfaceted: boolean,
): string {
  if (!rt.facets?.length) {
    return escapeUnfaceted ? escapeUnfacetedText(rt.text) : rt.text
  }

  let result = ''

  for (const segment of rt.segments()) {
    const link = segment.link
    if (link && bsky.matches(app.bsky.richtext.facet.link, link)) {
      result +=
        segment.text === link.uri || segment.text === toShortUrl(link.uri)
          ? link.uri
          : `[${segment.text}](${link.uri})`
    } else {
      result +=
        escapeUnfaceted && !segment.facet
          ? escapeUnfacetedText(segment.text)
          : segment.text
    }
  }

  return result
}

function escapeUnfacetedText(text: string): string {
  const escapedStarts = new Set<number>()
  const syntaxRanges: {start: number; end: number}[] = []

  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }

  for (const match of text.matchAll(/<([^<>\n]+)>/g)) {
    if (!getEnclosedLinkOrMention(match[1])) continue
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }

  const detected = new RichText({text})
  detected.detectFacetsWithoutResolution()
  for (const facet of detected.facets ?? []) {
    if (
      !facet.features.some(
        feature =>
          AppBskyRichtextFacet.isLink(feature) ||
          AppBskyRichtextFacet.isMention(feature),
      )
    ) {
      continue
    }
    const start = detected.unicodeText.slice(0, facet.index.byteStart).length
    if (
      !syntaxRanges.some(range => start >= range.start && start < range.end)
    ) {
      escapedStarts.add(start)
    }
  }

  let result = ''
  for (let i = 0; i < text.length; i++) {
    if (escapedStarts.has(i) || text[i] === '\\') result += '\\'
    result += text[i]
  }
  return result
}

import {AppBskyRichtextFacet} from '@atproto/api'
import {RichText} from '@bsky/sdk/richtext'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  formatMarkdownLinkDestination,
  MARKDOWN_LINK_PATTERN,
} from './markdown-links'
import {getEnclosedFacet} from './rich-text-manip'
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

      result += !requiresWarning
        ? href
        : loose
          ? `[${text}](${formatMarkdownLinkDestination(href)})`
          : text
    } else {
      result += segment.text
    }
  }

  return result
}

/** Preserve a post's text and facets when copying or redrafting it. */
export function richTextToRedraftString(rt: RichText): string {
  if (!rt.facets?.length) return escapeUnfacetedText(rt.text)

  const detected = new RichText({text: rt.text})
  detected.detectFacetsWithoutResolution()
  let result = ''

  for (const segment of rt.segments()) {
    const facet = segment.facet
    if (!facet) {
      result += escapeUnfacetedText(segment.text)
      continue
    }

    const link = facet.features.find(AppBskyRichtextFacet.isLink)
    if (
      link &&
      segment.text === toShortUrl(link.uri) &&
      /(^|\s|\()$/.test(rt.unicodeText.slice(0, facet.index.byteStart))
    ) {
      result += link.uri
      continue
    }
    if (link && segment.text === link.uri) {
      result += `[${segment.text}](${formatMarkdownLinkDestination(link.uri)})`
      continue
    }

    const automatic = detected.facets?.some(
      current =>
        current.index.byteStart === facet.index.byteStart &&
        current.index.byteEnd === facet.index.byteEnd &&
        sharesFeature(facet, current),
    )
    if (automatic) {
      result += segment.text
      continue
    }

    const enclosed = getEnclosedFacet(segment.text)
    if (enclosed && sharesFeature(facet, enclosed)) {
      result += `<${segment.text}>`
      continue
    }

    result += link
      ? `[${segment.text}](${formatMarkdownLinkDestination(link.uri)})`
      : segment.text
  }

  return result
}

function sharesFeature(
  original: AppBskyRichtextFacet.Main,
  detected: AppBskyRichtextFacet.Main,
): boolean {
  return original.features.some(feature =>
    detected.features.some(candidate => {
      if (AppBskyRichtextFacet.isLink(feature)) {
        return (
          AppBskyRichtextFacet.isLink(candidate) &&
          candidate.uri === feature.uri
        )
      }
      if (AppBskyRichtextFacet.isTag(feature)) {
        return (
          AppBskyRichtextFacet.isTag(candidate) && candidate.tag === feature.tag
        )
      }
      return (
        AppBskyRichtextFacet.isMention(feature) &&
        AppBskyRichtextFacet.isMention(candidate)
      )
    }),
  )
}

function escapeUnfacetedText(text: string): string {
  const escapedStarts = new Set<number>()
  const syntaxRanges: {start: number; end: number}[] = []

  for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) {
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }

  for (const match of text.matchAll(/<([^<>\n]+)>/g)) {
    if (
      syntaxRanges.some(
        range => match.index >= range.start && match.index < range.end,
      )
    ) {
      continue
    }
    if (!getEnclosedFacet(match[1])) continue
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }

  const detected = new RichText({text})
  detected.detectFacetsWithoutResolution()
  for (const facet of detected.facets ?? []) {
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

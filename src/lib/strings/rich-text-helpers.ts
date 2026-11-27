import {AppBskyRichtextFacet} from '@atproto/api'
import {RichText} from '@bsky/sdk/richtext'

import {
  type BluemojiRef,
  getBluemojiFacet,
  getBluemojiInsertionName,
  getBluemojiMatches,
  getBluemojiRefUri,
} from '#/features/bluemoji/util'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {codeBlocksIn, type Kind, kindOf, MARKERS, piecesOf} from './formatting'
import {
  ESCAPED_MARKDOWN_LINK_PATTERN,
  formatMarkdownLinkDestination,
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
export function richTextToRedraftString(
  rt: RichText,
  bluemoji: Record<string, BluemojiRef> = {},
): string {
  if (
    rt.facets?.some(facet => facet.features.some(feature => kindOf(feature)))
  ) {
    return redraftFormatting(rt)
  }
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

    const emoji = facet.features.map(getBluemojiFacet).find(Boolean)
    const uri = emoji && getBluemojiRefUri(emoji)
    if (emoji && uri) {
      const name = getBluemojiInsertionName(
        {uri, cid: emoji.record?.cid, record: {name: emoji.name}},
        bluemoji,
      )
      bluemoji[name] = {
        did: emoji.did,
        name: emoji.name,
        record: {uri, cid: emoji.record?.cid},
      }
      result +=
        segment.text === emoji.name ? name : `[${segment.text}](${name})`
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

    const mention = facet.features.find(AppBskyRichtextFacet.isMention)
    if (mention) {
      result += `[${segment.text}](${mention.did})`
      continue
    }

    result += link
      ? `[${segment.text}](${formatMarkdownLinkDestination(link.uri)})`
      : segment.text
  }

  return result
}

/** Rebuild source syntax from overlapping facets, including markerless foreign facets. */
function redraftFormatting(rt: RichText): string {
  const pieces = piecesOf(rt.text, rt.facets)
  let plain = ''
  const offsets = new Map<number, number>()
  for (const piece of pieces) {
    offsets.set(piece.start, plain.length)
    plain += piece.text
    offsets.set(piece.end, plain.length)
  }
  const toPlain = (at: number) => {
    if (offsets.has(at)) return offsets.get(at)!
    const piece = pieces.find(part => at > part.start && at < part.end)
    if (piece) return offsets.get(piece.start)! + at - piece.start
    const next = pieces.find(part => part.start >= at)
    return next ? offsets.get(next.start)! : plain.length
  }
  type Wrapper = {
    start: number
    end: number
    open: string
    close: string
    kind?: Kind
  }
  const wrappers: Wrapper[] = []
  for (const facet of rt.facets ?? []) {
    const sourceStart = rt.unicodeText.slice(0, facet.index.byteStart).length
    const sourceEnd = rt.unicodeText.slice(0, facet.index.byteEnd).length
    if (
      rt.unicodeText.utf16IndexToUtf8Index(sourceStart) !==
        facet.index.byteStart ||
      rt.unicodeText.utf16IndexToUtf8Index(sourceEnd) !== facet.index.byteEnd
    )
      continue
    const start = toPlain(sourceStart)
    const end = toPlain(sourceEnd)
    if (start >= end) continue
    for (const feature of facet.features) {
      const kind = kindOf(feature)
      if (kind) {
        const marker =
          MARKERS[kind].find(
            m =>
              rt.text.slice(sourceStart - m.length, sourceStart) === m &&
              rt.text.slice(sourceEnd, sourceEnd + m.length) === m,
          ) ?? MARKERS[kind][0]
        wrappers.push({start, end, open: marker, close: marker, kind})
      } else if (AppBskyRichtextFacet.isLink(feature)) {
        wrappers.push({
          start,
          end,
          open: '[',
          close: `](${formatMarkdownLinkDestination(feature.uri)})`,
        })
      } else if (
        AppBskyRichtextFacet.isMention(feature) ||
        AppBskyRichtextFacet.isTag(feature)
      ) {
        wrappers.push({start, end, open: '<', close: '>'})
      }
    }
  }
  wrappers.sort(
    (a, b) =>
      a.start - b.start || b.end - a.end || Number(!a.kind) - Number(!b.kind),
  )
  // Multiple facets may describe a single uninterrupted run of one style.
  const merged: Wrapper[] = []
  for (const wrapper of wrappers) {
    const previous = merged.find(
      candidate =>
        wrapper.kind &&
        candidate.kind === wrapper.kind &&
        candidate.end >= wrapper.start &&
        candidate.start <= wrapper.end,
    )
    if (previous) previous.end = Math.max(previous.end, wrapper.end)
    else merged.push(wrapper)
  }
  merged.sort(
    (a, b) =>
      a.start - b.start || b.end - a.end || Number(!a.kind) - Number(!b.kind),
  )
  const points = [
    ...new Set([0, plain.length, ...merged.flatMap(w => [w.start, w.end])]),
  ].sort((a, b) => a - b)
  let result = ''
  let active: Wrapper[] = []
  for (let i = 0; i < points.length; i++) {
    const at = points[i]
    // Split links at style boundaries rather than putting markers in a link label.
    const next = merged
      .filter(w => w.start <= at && w.end > at)
      .sort(
        (a, b) =>
          Number(!a.kind) - Number(!b.kind) ||
          a.start - b.start ||
          b.end - a.end,
      )
    let common = 0
    while (
      common < active.length &&
      common < next.length &&
      active[common] === next[common]
    )
      common++
    for (let j = active.length - 1; j >= common; j--) result += active[j].close
    for (let j = common; j < next.length; j++) result += next[j].open
    active = next
    const value = plain.slice(at, points[i + 1] ?? at)
    result += active.some(w => w.kind === 'code')
      ? value
      : active.some(w => !w.kind)
        ? value.replace(/[\\*_~`|]/g, '\\$&')
        : escapeUnfacetedText(value)
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
  const blocks = codeBlocksIn(text)

  for (const match of text.matchAll(ESCAPED_MARKDOWN_LINK_PATTERN)) {
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }

  for (const match of text.matchAll(/<([^<>\n]+)>/g)) {
    if (!getEnclosedFacet(match[1])) continue
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }

  const detected = new RichText({text})
  for (const match of getBluemojiMatches(detected)) {
    escapedStarts.add(match.index)
    syntaxRanges.push({start: match.index, end: match.index + match[0].length})
  }
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
    if (blocks.some(block => i >= block.start && i < block.end)) {
      result += text[i]
      continue
    }
    if (escapedStarts.has(i) || /[\\*_~`|]/.test(text[i])) result += '\\'
    result += text[i]
  }
  return result
}

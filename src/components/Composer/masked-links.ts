import {type TapperFacet} from '@bsky.app/tapper'
import {CASHTAG_REGEX} from '@bsky/sdk/richtext'

import {
  MARKDOWN_LINK_PATTERN,
  normalizeMarkdownLinkDestination,
} from '#/lib/strings/markdown-links'
import {
  getEnclosedFacet,
  isEscapedFacetSyntax,
  isInsideEscapedFacetSyntax,
} from '#/lib/strings/rich-text-manip'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/*
 * Capture only the destination as the value; highlight the entire expression.
 * The outer match wins over URL/mention/tag matches inside the label or URL.
 */
export const maskedLinkFacet = {
  pattern: MARKDOWN_LINK_PATTERN,
  validate: (match: RegExpMatchArray) =>
    !isEscapedFacetSyntax(match.input ?? '', match.index ?? 0),
}

const angleFeature = (value: string) => getEnclosedFacet(value)?.features[0]

/** Angle facets are escaped at their own opening delimiter. */
function isUnescapedAngleFacet(match: RegExpMatchArray): boolean {
  const text = match.input ?? ''
  const start = match.index ?? 0
  return !isEscapedFacetSyntax(text, start)
}

export const cashtagFacet = CASHTAG_REGEX

export const angleLinkFacet = {
  pattern: /<([^<>\n]+)>/g,
  validate: (match: RegExpMatchArray) =>
    isUnescapedAngleFacet(match) &&
    bsky.isType(app.bsky.richtext.facet.link, angleFeature(match[1])),
}

export const angleMentionFacet = {
  pattern: /<([^<>\n]+)>/g,
  validate: (match: RegExpMatchArray) =>
    isUnescapedAngleFacet(match) &&
    bsky.isType(app.bsky.richtext.facet.mention, angleFeature(match[1])),
}

export const angleTagFacet = {
  pattern: /<([^<>\n]+)>/g,
  validate: (match: RegExpMatchArray) =>
    isUnescapedAngleFacet(match) &&
    bsky.isType(app.bsky.richtext.facet.tag, angleFeature(match[1])),
}

export function escapeAwareFacet(
  definition:
    RegExp | {pattern: RegExp; validate?: (match: RegExpMatchArray) => boolean},
) {
  const pattern = definition instanceof RegExp ? definition : definition.pattern
  return {
    pattern,
    validate: (match: RegExpMatchArray) => {
      const boundaryLength = pattern.source.startsWith('(^|\\s|\\()')
        ? (match[1]?.length ?? 0)
        : 0
      const start = (match.index ?? 0) + boundaryLength
      return (
        !isInsideEscapedFacetSyntax(
          match.input ?? '',
          start,
          start + match[0].length - boundaryLength,
        ) &&
        (definition instanceof RegExp ||
          !definition.validate ||
          definition.validate(match))
      )
    },
  }
}

export function normalizeComposerLink(facet: TapperFacet): TapperFacet {
  if (facet.type === 'angleLink') {
    const feature = angleFeature(facet.value)
    return {
      ...facet,
      type: 'url',
      value: bsky.isType(app.bsky.richtext.facet.link, feature)
        ? feature.uri
        : facet.value,
    }
  }
  if (facet.type !== 'maskedLink') return facet
  return {
    ...facet,
    type: 'url',
    value: normalizeMarkdownLinkDestination(facet.value),
  }
}

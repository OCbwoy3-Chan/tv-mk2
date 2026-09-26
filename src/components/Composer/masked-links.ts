import {type TapperFacet} from '@bsky.app/tapper'

import {
  getEnclosedLinkOrMention,
  isEscapedFacetSyntax,
  isInsideEscapedMarkdownLink,
} from '#/lib/strings/rich-text-manip'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

// Capture only the destination as the value; highlight the entire expression.
// The outer match wins over URL/mention/tag matches inside the label or URL.
export const maskedLinkFacet = {
  pattern: /\[[^\]]+\]\(([^)]+)\)/g,
  validate: (match: RegExpMatchArray) =>
    !isEscapedFacetSyntax(match.input ?? '', match.index ?? 0),
}

const angleFeature = (value: string) =>
  getEnclosedLinkOrMention(value)?.features[0]

export const angleLinkFacet = {
  pattern: /<([^<>\n]+)>/g,
  validate: (match: RegExpMatchArray) =>
    !isEscapedFacetSyntax(match.input ?? '', match.index ?? 0) &&
    bsky.isType(app.bsky.richtext.facet.link, angleFeature(match[1])),
}

export const angleMentionFacet = {
  pattern: /<([^<>\n]+)>/g,
  validate: (match: RegExpMatchArray) =>
    !isEscapedFacetSyntax(match.input ?? '', match.index ?? 0) &&
    bsky.isType(app.bsky.richtext.facet.mention, angleFeature(match[1])),
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
        !isInsideEscapedMarkdownLink(
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
  const uri = facet.value
  return {
    ...facet,
    type: 'url',
    value: /^(https?:\/\/|mailto:)/.test(uri) ? uri : `https://${uri}`,
  }
}

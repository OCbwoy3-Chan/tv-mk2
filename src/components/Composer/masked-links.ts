import {type TapperFacet} from '@bsky.app/tapper'

// Capture only the destination as the value; highlight the entire expression.
// The outer match wins over URL/mention/tag matches inside the label or URL.
export const maskedLinkFacet = /\[[^\]]+\]\(([^)]+)\)/g

export function normalizeComposerLink(facet: TapperFacet): TapperFacet {
  if (facet.type !== 'maskedLink') return facet
  const uri = facet.value
  return {
    ...facet,
    type: 'url',
    value: /^(https?:\/\/|mailto:)/.test(uri) ? uri : `https://${uri}`,
  }
}

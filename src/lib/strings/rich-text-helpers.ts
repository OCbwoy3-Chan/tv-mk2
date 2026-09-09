import {type RichText} from '@bsky/sdk/richtext'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
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
  if (!rt.facets?.length) {
    return rt.text
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
      result += segment.text
    }
  }

  return result
}

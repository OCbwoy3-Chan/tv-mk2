import {AppBskyRichtextFacet} from '@atproto/api'
import {RichText, UnicodeString} from '@bsky/sdk/richtext'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {toShortUrl} from './url-helpers'

export function restoreLinks(
  text: string,
  facets?: AppBskyRichtextFacet.Main[],
): string {
  if (!facets?.length) {
    return text
  }

  const rt = new UnicodeString(text)
  const parts: string[] = []
  let lastIndex = 0

  const sortedFacets = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart,
  )

  for (const facet of sortedFacets) {
    const isLink = facet.features.find(AppBskyRichtextFacet.isLink)
    if (!isLink) {
      continue
    }

    parts.push(rt.slice(lastIndex, facet.index.byteStart))
    parts.push(isLink.uri)
    lastIndex = facet.index.byteEnd
  }

  parts.push(rt.slice(lastIndex))

  return parts.join('')
}

export function shortenLinks(rt: RichText, preserveLabels = false): RichText {
  if (!rt.facets?.length) {
    return rt
  }
  rt = rt.clone()
  // enumerate the link facets
  if (rt.facets) {
    for (const facet of rt.facets) {
      const isLink = !!facet.features.find(f =>
        bsky.isType(app.bsky.richtext.facet.link, f),
      )
      if (!isLink) {
        continue
      }

      // extract and shorten the URL
      const {byteStart, byteEnd} = facet.index
      const url = rt.unicodeText.slice(byteStart, byteEnd)
      if (
        preserveLabels &&
        !facet.features.some(
          feature =>
            bsky.isType(app.bsky.richtext.facet.link, feature) &&
            feature.uri === url,
        )
      ) {
        continue
      }
      const shortened = new UnicodeString(toShortUrl(url))

      // insert the shorten URL
      rt.insert(byteStart, shortened.utf16)
      // update the facet to cover the new shortened URL
      facet.index.byteStart = byteStart
      facet.index.byteEnd = byteStart + shortened.length
      // remove the old URL
      rt.delete(byteStart + shortened.length, byteEnd + shortened.length)
    }
  }
  return rt
}

// filter out any mention facets that didn't map to a user
export function stripInvalidMentions(rt: RichText): RichText {
  if (!rt.facets?.length) {
    return rt
  }
  rt = rt.clone()
  if (rt.facets) {
    rt.facets = rt.facets?.filter(facet => {
      const mention = facet.features.find(f =>
        bsky.isType(app.bsky.richtext.facet.mention, f),
      )
      if (mention && !mention.did) {
        return false
      }
      return true
    })
  }
  return rt
}

/** Remove link and mention facets inside angle brackets. Optionally remove the brackets too. */
export function stripAngleBracketedFacets(
  rt: RichText,
  {removeBrackets = false}: {removeBrackets?: boolean} = {},
): RichText {
  const enclosedRanges: {byteStart: number; byteEnd: number}[] = []
  const removableRanges: {byteStart: number; byteEnd: number}[] = []
  for (const match of rt.text.matchAll(/<[^<>\n]+>/g)) {
    const range = {
      byteStart: rt.unicodeText.utf16IndexToUtf8Index(match.index + 1),
      byteEnd: rt.unicodeText.utf16IndexToUtf8Index(
        match.index + match[0].length - 1,
      ),
    }
    enclosedRanges.push(range)

    if (removeBrackets) {
      const content = match[0].slice(1, -1).trim()
      const candidate = new RichText({text: content})
      candidate.detectFacetsWithoutResolution()
      const parsed = parseMarkdownLinks(content)
      if (
        rt.facets?.some(
          facet =>
            facet.index.byteStart >= range.byteStart &&
            facet.index.byteEnd <= range.byteEnd &&
            facet.features.some(
              feature =>
                AppBskyRichtextFacet.isLink(feature) ||
                AppBskyRichtextFacet.isMention(feature),
            ),
        ) ||
        candidate.facets?.some(
          facet =>
            facet.index.byteStart === 0 &&
            facet.index.byteEnd === candidate.length &&
            facet.features.some(
              feature =>
                AppBskyRichtextFacet.isLink(feature) ||
                AppBskyRichtextFacet.isMention(feature),
            ),
        ) ||
        (parsed.facets.length === 1 &&
          parsed.facets[0].index.byteStart === 0 &&
          parsed.facets[0].index.byteEnd ===
            new UnicodeString(parsed.text).length)
      ) {
        removableRanges.push(range)
      }
    }
  }

  if (rt.facets?.length && enclosedRanges.length) {
    rt.facets = rt.facets.filter(facet => {
      if (
        !facet.features.some(
          feature =>
            AppBskyRichtextFacet.isLink(feature) ||
            AppBskyRichtextFacet.isMention(feature),
        )
      ) {
        return true
      }

      return !enclosedRanges.some(
        range =>
          facet.index.byteStart >= range.byteStart &&
          facet.index.byteEnd <= range.byteEnd,
      )
    })
  }

  for (const range of removableRanges.reverse()) {
    rt.delete(range.byteEnd, range.byteEnd + 1)
    rt.delete(range.byteStart - 1, range.byteStart)
  }

  return rt
}

export function parseMarkdownLinks(text: string): {
  text: string
  facets: AppBskyRichtextFacet.Main[]
} {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  let newText = ''
  let lastIndex = 0
  const facets: AppBskyRichtextFacet.Main[] = []

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, linkText, linkUrl] = match
    const matchStart = match.index
    newText += text.slice(lastIndex, matchStart)
    const startByte = new UnicodeString(newText).length
    newText += linkText
    const endByte = new UnicodeString(newText).length
    let validUrl = linkUrl
    if (
      !validUrl.startsWith('http://') &&
      !validUrl.startsWith('https://') &&
      !validUrl.startsWith('mailto:')
    ) {
      validUrl = `https://${validUrl}`
    }

    facets.push({
      index: {
        byteStart: startByte,
        byteEnd: endByte,
      },
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: validUrl,
        },
      ],
    })

    lastIndex = matchStart + fullMatch.length
  }

  newText += text.slice(lastIndex)

  return {text: newText, facets}
}

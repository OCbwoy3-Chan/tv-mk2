import {AppBskyRichtextFacet} from '@atproto/api'
import {type Client} from '@atproto/lex'
import {type HandleString} from '@atproto/syntax'
import {RichText, UnicodeString} from '@bsky/sdk/richtext'

import {app, com} from '#/lexicons'
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

/** True when the character at index is preceded by an odd backslash run. */
export function isEscapedFacetSyntax(text: string, index: number): boolean {
  let backslashes = 0
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) {
    backslashes++
  }
  return backslashes % 2 === 1
}

/** Whether a detected editor facet sits inside an escaped masked link. */
export function isInsideEscapedMarkdownLink(
  text: string,
  start: number,
  end: number,
): boolean {
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (
      isEscapedFacetSyntax(text, match.index) &&
      start >= match.index &&
      end <= match.index + match[0].length
    ) {
      return true
    }
  }
  return false
}

function firstDetectedFacet(text: string) {
  const candidate = new RichText({text})
  candidate.detectFacetsWithoutResolution()
  return candidate.facets?.find(facet => facet.index.byteStart === 0)
}

/** Detect a facet that fills angle brackets, allowing trailing punctuation. */
export function getEnclosedFacet(text: string) {
  const trimmed = text.trim()
  const facet = firstDetectedFacet(trimmed)
  if (!facet) return undefined
  const trailing = new UnicodeString(trimmed).slice(facet.index.byteEnd)
  return /^[\p{P}]*$/u.test(trailing) ? facet : undefined
}

/** Apply backslash escapes and angle syntax to detected facets. */
export function applyFacetSyntax(
  rt: RichText,
  {removeSyntax = false}: {removeSyntax?: boolean} = {},
): RichText {
  const text = rt.text
  const toByte = (index: number) => rt.unicodeText.utf16IndexToUtf8Index(index)
  const protectedRanges: {start: number; end: number}[] = []
  const deletionPoints: number[] = []

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '\\') continue
    const start = i
    while (text[i] === '\\') i++
    const end = i
    for (let pair = start; pair + 1 < end; pair += 2) {
      deletionPoints.push(pair)
    }
    if ((end - start) % 2 === 1) {
      const rest = text.slice(end)
      const markdown = /^\[[^\]]+\]\(([^)]+)\)/.exec(rest)
      const angle = /^<[^<>\n]+>/.exec(rest)
      const detected = firstDetectedFacet(rest)
      const length =
        markdown?.[0].length ??
        angle?.[0].length ??
        (detected
          ? new UnicodeString(rest).slice(0, detected.index.byteEnd).length
          : undefined)
      if (length) {
        protectedRanges.push({start: toByte(end), end: toByte(end + length)})
        deletionPoints.push(end - 1)
      }
    }
    i = end - 1
  }

  if (rt.facets?.length && protectedRanges.length) {
    rt.facets = rt.facets.filter(
      facet =>
        !protectedRanges.some(
          range =>
            facet.index.byteStart >= range.start &&
            facet.index.byteEnd <= range.end,
        ),
    )
  }

  for (const match of text.matchAll(/<[^<>\n]+>/g)) {
    const start = toByte(match.index)
    const end = toByte(match.index + match[0].length)
    if (
      protectedRanges.some(range => start >= range.start && end <= range.end)
    ) {
      continue
    }

    const content = match[0].slice(1, -1)
    const trimmed = content.trim()
    const contentStart = match.index + 1 + content.indexOf(trimmed)
    const facet = getEnclosedFacet(trimmed)
    const contentByteStart = toByte(contentStart)
    const contentByteEnd = toByte(contentStart + trimmed.length)
    const existing = rt.facets?.some(
      current =>
        current.index.byteStart === contentByteStart &&
        current.index.byteEnd === contentByteEnd &&
        current.features.length > 0,
    )
    if (!facet && !existing) continue

    if (facet && !existing) {
      const byteStart = toByte(contentStart) + facet.index.byteStart
      const byteEnd = toByte(contentStart) + facet.index.byteEnd
      if (
        !rt.facets?.some(
          current =>
            current.index.byteStart < byteEnd &&
            current.index.byteEnd > byteStart,
        )
      ) {
        rt.facets = [
          ...(rt.facets ?? []),
          {
            ...facet,
            index: {byteStart, byteEnd},
          },
        ].sort((a, b) => a.index.byteStart - b.index.byteStart)
      }
    }

    deletionPoints.push(match.index, match.index + match[0].length - 1)
  }

  if (removeSyntax) {
    for (const index of deletionPoints.sort((a, b) => b - a)) {
      const byte = toByte(index)
      rt.delete(byte, byte + 1)
    }
  }

  return rt
}

/** Resolve handles added by angle link syntax after automatic facet detection. */
export async function resolveSyntaxMentions(rt: RichText, client: Client) {
  const failed = new Set<NonNullable<typeof rt.facets>[number]>()
  await Promise.all(
    (rt.facets ?? []).flatMap(facet =>
      facet.features.flatMap(feature => {
        if (
          !AppBskyRichtextFacet.isMention(feature) ||
          feature.did.startsWith('did:')
        ) {
          return []
        }
        return [
          client
            .call(com.atproto.identity.resolveHandle, {
              handle: feature.did as HandleString,
            })
            .then(({did}) => {
              feature.did = did
            })
            .catch(() => {
              failed.add(facet)
            }),
        ]
      }),
    ),
  )
  if (failed.size) {
    rt.facets = rt.facets?.filter(facet => !failed.has(facet))
  }
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
    if (isEscapedFacetSyntax(text, match.index)) continue
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

// Formatting syntax adapted from Parfait (juliet.paris), under the Zero-Clause BSD license.
import {type AppBskyRichtextFacet} from '@atproto/api'
import {type Unknown$TypedObject} from '@atproto/lex'
import {type RichText, UnicodeString} from '@bsky/sdk/richtext'

export type Kind = 'bold' | 'italic' | 'strikethrough' | 'code' | 'spoiler'
export const MARKERS: Record<Kind, string[]> = {
  bold: ['**'],
  italic: ['*', '_'],
  strikethrough: ['~~'],
  code: ['`'],
  spoiler: ['||'],
}
const KINDS = Object.keys(MARKERS) as Kind[]
const NSID = 'social.parfait.richtext.facet'
export const featureOf = (kind: Kind): Unknown$TypedObject =>
  ({$type: `${NSID}#${kind}`}) as unknown as Unknown$TypedObject
export function kindOf(
  feature: {$type?: string} | undefined,
): Kind | undefined {
  const type = feature?.$type
  if (typeof type !== 'string' || !type.startsWith(`${NSID}#`)) return
  const kind = type.slice(NSID.length + 1) as Kind
  return KINDS.includes(kind) ? kind : undefined
}

type Span = {start: number; end: number}
export type Formatted = Span & {kind: Kind; marker: number}
export type CodeBlock = Span & {language: string; code: string}
type Facet = AppBskyRichtextFacet.Main
const HIDDEN = '\uE000'
const inside = (at: number, spans: Span[]) =>
  spans.some(span => at >= span.start && at < span.end)
const overlaps = (a: Span, b: Span) => a.start < b.end && b.start < a.end

export const codeBlocksIn = (text: string): CodeBlock[] =>
  [
    ...text.matchAll(
      /(?<=^|\n)```([^\s`]*)[^\S\n]*\n([\s\S]*?)\n```[^\S\n]*(?=\n|$)/g,
    ),
  ].map(match => ({
    start: match.index,
    end: match.index + match[0].length,
    language: match[1].toLowerCase(),
    code: match[2],
  }))

const patterns = [
  ['spoiler', '||'],
  ['bold', '**'],
  ['strikethrough', '~~'],
  ['italic', '*'],
  ['italic', '_'],
].map(([kind, marker]) => {
  const one = marker[0].replace(/[*|]/g, '\\$&')
  const m = marker.replace(/[*|]/g, '\\$&')
  const words =
    marker === '||'
      ? '[^\\n]*?\\S[^\\n]*?'
      : marker.length === 1
        ? `[^\\s${one}](?:[^\\n]*?[^\\s${one}])?`
        : '\\S(?:[^\\n]*?\\S)?'
  return {
    kind: kind as Kind,
    marker,
    pattern: new RegExp(
      `(?<![\\p{L}\\p{N}${one}])${m}(${words})${m}(?![\\p{L}\\p{N}${one}])`,
      'gu',
    ),
  }
})

/** All positions returned here are UTF-16, matching editor selections. */
export function formattingIn(
  text: string,
  linked: Span[] = [],
): {
  formats: Formatted[]
  escapes: number[]
  linked: Span[]
  blocks: CodeBlock[]
} {
  if (linked.length) {
    const candidates = formattingIn(text).formats
    linked = linked.map(span => {
      let end = span.end
      for (const format of candidates) {
        if (
          format.start <= span.start &&
          format.end > span.start &&
          format.end < end &&
          end <= format.end + format.marker
        )
          end = format.end
      }
      return end === span.end ? span : {start: span.start, end}
    })
  }
  const formats: Formatted[] = []
  const escapes: number[] = []
  const masked = text.split('')
  const blocks = codeBlocksIn(text)
  for (const block of blocks) {
    for (let i = block.start; i < block.end; i++) masked[i] = HIDDEN
  }
  for (let i = 0; i < text.length; i++) {
    if (inside(i, linked) || inside(i, blocks)) continue
    if (
      text[i] === '\\' &&
      '*_~`|\\'.includes(text[i + 1] ?? '') &&
      i + 1 < text.length
    ) {
      escapes.push(i)
      masked[i] = masked[i + 1] = HIDDEN
      i++
    } else if (text[i] === '`') {
      const close = text.indexOf('`', i + 1)
      const line = text.indexOf('\n', i + 1)
      if (
        close > i + 1 &&
        (line === -1 || close < line) &&
        text.slice(i + 1, close).trim()
      ) {
        formats.push({kind: 'code', start: i + 1, end: close, marker: 1})
        for (let j = i; j <= close; j++) masked[j] = HIDDEN
        i = close
      }
    }
  }
  const code = formats.slice()
  const outsideCode = linked.filter(
    span =>
      !code.some(c => overlaps(span, {start: c.start - 1, end: c.end + 1})) &&
      !blocks.some(b => overlaps(span, b)),
  )
  for (const span of outsideCode) {
    for (let i = span.start; i < span.end; i++) {
      if ('*_~|'.includes(masked[i])) masked[i] = HIDDEN
    }
  }
  for (const {kind, marker, pattern} of patterns) {
    const m = marker.length
    for (const match of masked.join('').matchAll(pattern)) {
      const start = match.index + m
      const end = start + match[1].length
      if (
        outsideCode.some(
          s => overlaps(s, {start, end}) && (s.start < start || s.end > end),
        )
      )
        continue
      const outer = {start: start - m, end: end + m}
      if (
        formats.some(f => {
          const other = {start: f.start - f.marker, end: f.end + f.marker}
          if (!overlaps(outer, other)) return false
          return (
            !(outer.start >= f.start && outer.end <= f.end) &&
            !(other.start >= start && other.end <= end)
          )
        })
      )
        continue
      formats.push({kind, start, end, marker: m})
      for (let i = 0; i < m; i++)
        masked[outer.start + i] = masked[end + i] = HIDDEN
    }
  }
  formats.sort((a, b) => a.start - b.start || b.end - a.end)
  const spoilers = formats.filter(f => f.kind === 'spoiler')
  return {
    formats,
    escapes,
    linked: outsideCode.filter(span => !spoilers.some(f => overlaps(span, f))),
    blocks,
  }
}

/** ROT13 letters and ROT5 digits; an involution that preserves UTF-8 byte lengths. */
export const shift = (text: string) =>
  text.replace(/[a-zA-Z0-9]/g, char => {
    const code = char.charCodeAt(0)
    if (char <= '9') return String.fromCharCode(((code - 48 + 5) % 10) + 48)
    const base = char <= 'Z' ? 65 : 97
    return String.fromCharCode(((code - base + 13) % 26) + base)
  })

/** Reject malformed byte ranges, including offsets within a Unicode code point. */
function spansOf(text: string, facets: Facet[] | undefined) {
  const boundaries = new Map<number, number>([[0, 0]])
  let byte = 0
  let utf16 = 0
  for (const char of text) {
    const cp = char.codePointAt(0)!
    byte += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4
    utf16 += char.length
    boundaries.set(byte, utf16)
  }
  return (facets ?? []).flatMap(facet => {
    const start = boundaries.get(facet.index?.byteStart)
    const end = boundaries.get(facet.index?.byteEnd)
    return start !== undefined && end !== undefined && start < end
      ? [{start, end, facet}]
      : []
  })
}

export type Piece = Span & {
  text: string
  features: Facet['features']
  kinds: Kind[]
  spoiler?: number
}

/** Overlap-aware segmentation, never using the SDK's non-overlapping iterator. */
export function piecesOf(text: string, facets: Facet[] | undefined): Piece[] {
  const spans = spansOf(text, facets)
  const hidden: Span[] = []
  const spoilers: Span[] = []
  for (const kind of KINDS) {
    const runs: Span[] = []
    for (const span of spans
      .filter(s => s.facet.features.some(f => kindOf(f) === kind))
      .sort((a, b) => a.start - b.start)) {
      const last = runs.at(-1)
      if (last && last.end >= span.start)
        last.end = Math.max(last.end, span.end)
      else runs.push({start: span.start, end: span.end})
    }
    if (kind === 'spoiler') spoilers.push(...runs)
    for (const run of runs) {
      const marker = MARKERS[kind].find(
        m =>
          run.start >= m.length &&
          text.slice(run.start - m.length, run.start) === m &&
          text.slice(run.end, run.end + m.length) === m,
      )
      if (marker)
        hidden.push(
          {start: run.start - marker.length, end: run.start},
          {start: run.end, end: run.end + marker.length},
        )
    }
  }
  const points = [
    ...new Set([
      0,
      text.length,
      ...spans.flatMap(s => [s.start, s.end]),
      ...hidden.flatMap(s => [s.start, s.end]),
    ]),
  ].sort((a, b) => a - b)
  const pieces: Piece[] = []
  for (let i = 0; i + 1 < points.length; i++) {
    const start = points[i]
    const end = points[i + 1]
    if (start === end || inside(start, hidden)) continue
    const features = [
      ...new Set(
        spans
          .filter(s => s.start <= start && s.end >= end)
          .flatMap(s => s.facet.features),
      ),
    ]
    const kinds = [
      ...new Set(features.map(kindOf).filter((k): k is Kind => !!k)),
    ]
    const spoiler = spoilers.findIndex(s => s.start <= start && s.end >= end)
    const value = text.slice(start, end)
    pieces.push({
      text: spoiler < 0 ? value : shift(value),
      start,
      end,
      features,
      kinds,
      ...(spoiler < 0 ? {} : {spoiler}),
    })
  }
  return pieces
}

const posted = new WeakMap<RichText, string>()

/** Preview keeps source text intact; posting retains markers and encodes spoilers once. */
export function applyFormattingFacets(
  rt: RichText,
  {forPosting = false}: {forPosting?: boolean} = {},
): RichText {
  if (posted.get(rt) === rt.text) return rt
  const spans = spansOf(rt.text, rt.facets)
  const linked = spans.filter(s => s.facet.features.some(f => !kindOf(f)))
  const parsed = formattingIn(rt.text, linked)
  const facets = (rt.facets ?? []).flatMap(facet => {
    const span = spans.find(s => s.facet === facet)
    if (!span) return []
    const shown = parsed.linked.find(
      current => current.start === span.start && current.end <= span.end,
    )
    if (shown && shown.end < span.end) {
      const before = rt.text.slice(span.start, span.end)
      const after = rt.text.slice(span.start, shown.end)
      for (const feature of facet.features) {
        if (
          feature.$type === 'app.bsky.richtext.facet#link' &&
          'uri' in feature &&
          typeof feature.uri === 'string'
        ) {
          if (feature.uri === before) feature.uri = after as typeof feature.uri
          else if (feature.uri === `https://${before}`) {
            feature.uri = `https://${after}`
          }
        }
      }
      facet.index.byteEnd = rt.unicodeText.utf16IndexToUtf8Index(shown.end)
    }
    const features = facet.features.filter(f =>
      kindOf(f)
        ? false
        : !parsed.blocks.some(b => overlaps(span, b)) &&
          !parsed.formats.some(
            format =>
              (format.kind === 'code' || format.kind === 'spoiler') &&
              overlaps(span, format),
          ),
    )
    return features.length
      ? [
          features.length === facet.features.length
            ? facet
            : {...facet, features},
        ]
      : []
  })
  for (const format of parsed.formats) {
    facets.push({
      index: {
        byteStart: rt.unicodeText.utf16IndexToUtf8Index(format.start),
        byteEnd: rt.unicodeText.utf16IndexToUtf8Index(format.end),
      },
      features: [featureOf(format.kind)],
    })
  }
  rt.facets = facets.length
    ? facets.sort((a, b) => a.index.byteStart - b.index.byteStart)
    : rt.facets?.length
      ? []
      : rt.facets
  if (forPosting) {
    const spoilers = parsed.formats.filter(f => f.kind === 'spoiler')
    if (spoilers.length) {
      let value = ''
      let start = 0
      for (const spoiler of spoilers) {
        if (spoiler.start < start) continue
        value +=
          rt.text.slice(start, spoiler.start) +
          shift(rt.text.slice(spoiler.start, spoiler.end))
        start = spoiler.end
      }
      rt.unicodeText = new UnicodeString(value + rt.text.slice(start))
    }
    for (const index of parsed.escapes.sort((a, b) => b - a)) {
      const byte = rt.unicodeText.utf16IndexToUtf8Index(index)
      rt.delete(byte, byte + 1)
    }
    posted.set(rt, rt.text)
  }
  return rt
}

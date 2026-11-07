import {TID} from '@atproto/common-web'
import {countGraphemes, graphemeSegments} from 'unicode-segmenter/grapheme'

export const POLL_DURATION_HOURS = [24, 72, 168]
export const POLL_MAX_STATEMENTS = 10
export const POLL_STATEMENT_MAX_GRAPHEMES = 400
export const POLL_STATEMENT_MAX_BYTES = 2000
export const POLL_STATEMENT_MAX_CHARS = 997
export const POLL_TOPIC_MAX_GRAPHEMES = 200
export const POLL_TOPIC_MAX_BYTES = 1000

export const POLL_VOTE_VALUES = ['agree', 'disagree', 'pass'] as const
export type PollVoteValue = (typeof POLL_VOTE_VALUES)[number]

export type AssemblyRef = {
  rkey: string
  createdAt: string
  fingerprint: string
  conversationId?: string
  reportId?: string
}

export type PollDraft = {
  statements: string[]
  provider?: 'tokimeki'
  durationHours?: number
  record?: {rkey: string; createdAt: string}
  assembly?: AssemblyRef
}

export type PollStatementIssue = 'empty' | 'too_long' | 'invalid' | 'duplicate'

const TRUNCATION_MARK = '…'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function inspectText(text: string): {
  bytes: number
  wellFormed: boolean
  hasNul: boolean
} {
  let bytes = 0
  let wellFormed = true
  let hasNul = false
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i)
    if (unit === 0) hasNul = true
    if (unit < 0x80) {
      bytes += 1
    } else if (unit < 0x800) {
      bytes += 2
    } else if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4
        i++
      } else {
        wellFormed = false
        bytes += 3
      }
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      wellFormed = false
      bytes += 3
    } else {
      bytes += 3
    }
  }
  return {bytes, wellFormed, hasNul}
}

export function normalizePollText(text: string): string {
  return text.trim().normalize('NFC')
}

export function getStatementIssue(text: string): PollStatementIssue | null {
  const statement = normalizePollText(text)
  if (statement.length === 0) return 'empty'
  const {bytes, wellFormed, hasNul} = inspectText(statement)
  if (!wellFormed || hasNul) return 'invalid'
  if (
    bytes > POLL_STATEMENT_MAX_BYTES ||
    statement.length > POLL_STATEMENT_MAX_CHARS ||
    countGraphemes(statement) > POLL_STATEMENT_MAX_GRAPHEMES
  ) {
    return 'too_long'
  }
  return null
}

export function getStatementIssues(
  statements: string[],
  provider?: PollDraft['provider'],
): (PollStatementIssue | null)[] {
  const seen = new Set<string>()
  return statements.map(text => {
    const issue = getStatementIssue(text)
    if (issue) return issue
    if (
      provider === 'tokimeki' &&
      (inspectText(normalizePollText(text)).bytes > 100 ||
        countGraphemes(normalizePollText(text)) > 50)
    ) {
      return 'too_long'
    }
    const key = normalizePollText(text).toLowerCase()
    if (seen.has(key)) return 'duplicate'
    seen.add(key)
    return null
  })
}

export function isPollDraftPublishable(draft: PollDraft): boolean {
  const statements = pollStatementsForPublish(draft)
  return (
    (draft.provider !== 'tokimeki' ||
      draft.durationHours === undefined ||
      POLL_DURATION_HOURS.includes(draft.durationHours)) &&
    statements.length >= (draft.provider === 'tokimeki' ? 2 : 1) &&
    statements.length <=
      (draft.provider === 'tokimeki' ? 4 : POLL_MAX_STATEMENTS) &&
    getStatementIssues(statements, draft.provider).every(
      issue => issue === null,
    )
  )
}

export function pollStatementsForPublish(draft: PollDraft): string[] {
  const statements = draft.statements.map(normalizePollText)
  return draft.provider === 'tokimeki' ? statements.filter(Boolean) : statements
}

export function pollTopicFromText(text: string): string {
  const topic = normalizePollText(text).replace(/\s+/g, ' ')
  if (
    countGraphemes(topic) <= POLL_TOPIC_MAX_GRAPHEMES &&
    inspectText(topic).bytes <= POLL_TOPIC_MAX_BYTES
  ) {
    return topic
  }
  const markBytes = inspectText(TRUNCATION_MARK).bytes
  let kept = ''
  let graphemes = 0
  let bytes = 0
  for (const {segment} of graphemeSegments(topic)) {
    const segmentBytes = inspectText(segment).bytes
    if (
      graphemes + 1 > POLL_TOPIC_MAX_GRAPHEMES - 1 ||
      bytes + segmentBytes > POLL_TOPIC_MAX_BYTES - markBytes
    ) {
      break
    }
    kept += segment
    graphemes += 1
    bytes += segmentBytes
  }
  return kept.trimEnd() + TRUNCATION_MARK
}

export function isPollTopicPublishable(
  text: string,
  provider?: PollDraft['provider'],
): boolean {
  if (provider === 'tokimeki' && normalizePollText(text).length > 300) {
    return false
  }
  const topic =
    provider === 'tokimeki' ? normalizePollText(text) : pollTopicFromText(text)
  if (topic.length === 0 || topic === TRUNCATION_MARK) return false
  const {wellFormed, hasNul} = inspectText(topic)
  return wellFormed && !hasNul
}

function decodeAssemblyRef(value: unknown): AssemblyRef | undefined {
  if (!isObject(value)) return undefined
  const {rkey, createdAt, fingerprint, conversationId, reportId} = value
  if (
    typeof rkey !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof fingerprint !== 'string'
  ) {
    return undefined
  }
  return {
    rkey,
    createdAt,
    fingerprint,
    conversationId:
      typeof conversationId === 'string' ? conversationId : undefined,
    reportId: typeof reportId === 'string' ? reportId : undefined,
  }
}

export function decodePollDraft(value: unknown): PollDraft | undefined {
  if (!isObject(value)) return undefined
  const {statements, assembly, provider, record, durationHours} = value
  if (
    !Array.isArray(statements) ||
    statements.length < 1 ||
    statements.length > POLL_MAX_STATEMENTS ||
    !statements.every(s => typeof s === 'string')
  ) {
    return undefined
  }
  if (provider !== undefined && provider !== 'tokimeki') return undefined
  let pollRecord: PollDraft['record']
  if (
    provider === 'tokimeki' &&
    isObject(record) &&
    typeof record.rkey === 'string' &&
    typeof record.createdAt === 'string' &&
    Number.isFinite(Date.parse(record.createdAt))
  ) {
    try {
      TID.fromStr(record.rkey)
      pollRecord = {rkey: record.rkey, createdAt: record.createdAt}
    } catch {}
  }
  return {
    statements,
    assembly: decodeAssemblyRef(assembly),
    ...(provider === 'tokimeki'
      ? {
          provider,
          ...(pollRecord ? {record: pollRecord} : {}),
          ...(typeof durationHours === 'number' &&
          POLL_DURATION_HOURS.includes(durationHours)
            ? {durationHours}
            : {}),
        }
      : {}),
  }
}

/**
 * Witchsky Storage Manifest — codec
 *
 * Encodes arbitrary JSON as a thread of draft-post text segments.
 * The first segment is a plaintext manifest header; subsequent segments
 * contain the payload encoded as gzip+u15 (15-bit Unicode codepoints
 * starting at U+3400, making the data look like CJK Unified Ideographs).
 *
 * Manifest format (one field per line):
 *   witchsky:storage:v1
 *   Do not change me! These are your Witchsky settings.
 *   updatedAt=<ISO8601>
 *   codec=gzip+u15
 *   overflowSegments=<N>
 *   bytes=<N>
 *   sha256=<hex>
 *   manifestHash=<hex>
 *
 * manifestHash is sha256 of all lines above it joined by '\n', so the
 * manifest is self-authenticating.
 */

import {gzip, inflate} from 'pako'
import {sha256} from '@noble/hashes/sha256'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE = 0x3400
const BITS_PER_CHAR = 15
const SEGMENT_MAX_GRAPHEMES = 1000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// u15 codec (reference implementation from spec)
// ---------------------------------------------------------------------------

function u15Encode(data: Uint8Array): string {
  const bits: number[] = []
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1)
  }
  while (bits.length % BITS_PER_CHAR !== 0) bits.push(0)
  let result = ''
  for (let i = 0; i < bits.length; i += BITS_PER_CHAR) {
    let val = 0
    for (let j = 0; j < BITS_PER_CHAR; j++) val = (val << 1) | bits[i + j]
    result += String.fromCodePoint(val + BASE)
  }
  return result
}

function u15Decode(encoded: string): Uint8Array {
  const bits: number[] = []
  // for…of correctly handles Unicode codepoints (no broken surrogates)
  for (const char of encoded) {
    const val = char.codePointAt(0)! - BASE
    for (let i = BITS_PER_CHAR - 1; i >= 0; i--) bits.push((val >> i) & 1)
  }
  const data = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < data.length; i++) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i * 8 + j]
    data[i] = byte
  }
  return data
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const MANIFEST_COMMENT = 'Do not change me! These are your Witchsky settings.'

/**
 * Encode an arbitrary value to an array of draft-post text segments.
 * segments[0] is the manifest; segments[1..] are u15-encoded data chunks,
 * each at most SEGMENT_MAX_GRAPHEMES characters.
 */
export function encode(data: unknown): string[] {
  const json = JSON.stringify(data)
  const compressed = gzip(new TextEncoder().encode(json))
  const compressedHash = toHex(sha256(compressed))

  const encoded = u15Encode(compressed)

  // All codepoints are in U+3400–U+4DBF (CJK Extension A), no surrogates,
  // so string .length === grapheme count. Safe to slice by index.
  const dataSegments: string[] = []
  for (let i = 0; i < encoded.length; i += SEGMENT_MAX_GRAPHEMES) {
    dataSegments.push(encoded.slice(i, i + SEGMENT_MAX_GRAPHEMES))
  }
  // Edge case: empty payload produces a single empty segment; omit it so
  // overflowSegments can be 0 and still round-trip through decode.
  if (dataSegments.length === 1 && dataSegments[0] === '') {
    dataSegments.length = 0
  }

  // Build manifest without manifestHash, then hash it.
  // Each field is on its own line; line 2 is a human-readable comment.
  const partial = [
    'witchsky:storage:v1',
    MANIFEST_COMMENT,
    `updatedAt=${new Date().toISOString()}`,
    `codec=gzip+u15`,
    `overflowSegments=${dataSegments.length}`,
    `bytes=${compressed.length}`,
    `sha256=${compressedHash}`,
  ].join('\n')
  const manifestHash = toHex(sha256(new TextEncoder().encode(partial)))
  const manifest = `${partial}\nmanifestHash=${manifestHash}`

  return [manifest, ...dataSegments]
}

/**
 * Decode an array of draft-post text segments back to the original value.
 * Throws a descriptive Error for any validation failure.
 * Validation order: manifestHash → segment count → bytes → sha256 → decompress → parse
 */
export function decode(segments: string[]): unknown {
  if (segments.length === 0) {
    throw new Error('storage-manifest: no segments')
  }

  const manifestText = segments[0]
  const lines = manifestText.split('\n')

  if (lines[0] !== 'witchsky:storage:v1') {
    throw new Error('storage-manifest: invalid manifest prefix')
  }

  // Last line must be the manifestHash
  const lastLine = lines[lines.length - 1]
  const hashLineMatch = lastLine.match(/^manifestHash=([0-9a-f]+)$/)
  if (!hashLineMatch) {
    throw new Error('storage-manifest: missing manifestHash field')
  }
  const manifestHashField = hashLineMatch[1]

  // partial = everything except the last line
  const partial = lines.slice(0, -1).join('\n')

  // 1. Verify manifestHash
  const expectedManifestHash = toHex(
    sha256(new TextEncoder().encode(partial)),
  )
  if (expectedManifestHash !== manifestHashField) {
    throw new Error('storage-manifest: manifestHash mismatch')
  }

  // Parse key=value fields from lines 2.. (line 0 = header, line 1 = comment)
  const fields: Record<string, string> = {}
  for (const line of lines.slice(2, -1)) {
    const eq = line.indexOf('=')
    if (eq !== -1) fields[line.slice(0, eq)] = line.slice(eq + 1)
  }

  // 2. Codec check
  if (fields.codec !== 'gzip+u15') {
    throw new Error(`storage-manifest: unknown codec "${fields.codec}"`)
  }

  const overflowSegments = parseInt(fields.overflowSegments, 10)
  const bytes = parseInt(fields.bytes, 10)
  const sha256Hex = fields.sha256

  // 3. Segment count
  if (segments.length - 1 !== overflowSegments) {
    throw new Error(
      `storage-manifest: expected ${overflowSegments} data segments, got ${segments.length - 1}`,
    )
  }

  // 4. Decode u15 → compressed bytes
  const encoded = segments.slice(1).join('')
  const decoded = u15Decode(encoded)

  // 5. bytes length check
  if (decoded.length < bytes) {
    throw new Error(
      `storage-manifest: decoded length ${decoded.length} is less than declared bytes ${bytes}`,
    )
  }

  // Trim any padding byte that u15 decoding may have appended
  const compressed = decoded.length === bytes ? decoded : decoded.subarray(0, bytes)

  // 6. sha256 check
  const actualHash = toHex(sha256(compressed))
  if (actualHash !== sha256Hex) {
    throw new Error('storage-manifest: sha256 mismatch')
  }

  // 7. Decompress
  let jsonBytes: Uint8Array
  try {
    jsonBytes = inflate(compressed)
  } catch (e) {
    throw new Error(`storage-manifest: decompression failed: ${e}`)
  }

  // 8. Parse
  try {
    return JSON.parse(new TextDecoder().decode(jsonBytes))
  } catch (e) {
    throw new Error(`storage-manifest: JSON parse failed: ${e}`)
  }
}

/**
 * Return true if the given text looks like a witchsky storage manifest header.
 * Used to identify the storage draft among all of a user's drafts.
 */
export function isManifestSegment(text: string): boolean {
  return text.startsWith('witchsky:storage:v1\n')
}

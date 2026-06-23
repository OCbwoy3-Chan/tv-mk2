const RKEY_REGEX = /^[A-Za-z0-9._~:-]{1,512}$/
const TID_REGEX = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/
const TID_CHAR_REGEX = /^[234567abcdefghijklmnopqrstuvwxyz]+$/

export function normalizeAtprotoRkey(value: string): string {
  return value.trim()
}

export function isValidAtprotoRkey(value: string): boolean {
  if (value === '.' || value === '..') return false
  return RKEY_REGEX.test(value)
}

export function buildPrefixedAtprotoRkey(prefix: string, tid: string) {
  return `${prefix}${tid.slice(prefix.length)}`
}

export function buildSuffixedAtprotoRkey(tid: string, suffix: string) {
  return `${tid.slice(0, tid.length - suffix.length)}${suffix}`
}

export function isValidAtprotoTid(value: string): boolean {
  return TID_REGEX.test(value)
}

export function isValidAtprotoTidPrefix(value: string): boolean {
  if (value.length < 1 || value.length > 13) return false
  if (value.length === 13) return isValidAtprotoTid(value)
  if (!TID_CHAR_REGEX.test(value)) return false
  return /^[234567abcdefghij]/.test(value[0])
}

export function isValidAtprotoTidSuffix(value: string): boolean {
  if (value.length < 1 || value.length > 12) return false
  return TID_CHAR_REGEX.test(value)
}

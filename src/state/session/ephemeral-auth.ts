/** Authentication failures should offer login; network and action errors should not. */
export function isEphemeralAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const value = error as {
    status?: number
    error?: string
    code?: string
    name?: string
    message?: string
    cause?: unknown
  }
  if (value.status === 401) return true
  const text = [value.error, value.code, value.name, value.message].join(' ')
  return (
    /ScopeMissing|Missing required scope|TokenInvalid|TokenExpired|TokenRevoked|invalid_grant|InvalidToken|ExpiredToken|AuthRequired|AuthenticationRequired|SessionNotFound|Session not found|Unknown session|No session|Expected an active session|authorize this account for the selected app server/i.test(text) ||
    (value.cause !== error && isEphemeralAuthError(value.cause))
  )
}

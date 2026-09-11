import {getErrorName, getErrorStatus} from '#/lib/xrpc-error'

/** These service failures can use general suggestions instead of topic suggestions. */
export function canFallbackToGeneralSuggestions(error: unknown) {
  return (
    [404, 501].includes(getErrorStatus(error) ?? 0) ||
    (getErrorStatus(error) === 400 &&
      getErrorName(error) === 'InvalidRequest' &&
      error instanceof Error &&
      error.message === 'Upstream server responded with a 400 error')
  )
}

import {getErrorName, getErrorStatus} from '#/lib/xrpc-error'

/** Only fall back for an unavailable endpoint, not malformed queries or auth errors. */
export function isSearchV2Unavailable(error: unknown): boolean {
  return (
    [404, 501].includes(getErrorStatus(error) ?? 0) ||
    ['MethodNotImplemented', 'NotImplemented', 'UnsupportedMethod'].includes(
      getErrorName(error) ?? '',
    ) ||
    (getErrorStatus(error) === 400 &&
      getErrorName(error) === 'InvalidRequest' &&
      error instanceof Error &&
      error.message === 'Search v2 is not enabled')
  )
}

/** Blacksky's search proxy can fail even while its other AppView endpoints work. */
export function isBlackskySearchUpstreamFailure(error: unknown): boolean {
  return (
    getErrorStatus(error) === 502 &&
    getErrorName(error) === 'InternalServerError' &&
    error instanceof Error &&
    error.message === 'Failed to perform upstream request'
  )
}

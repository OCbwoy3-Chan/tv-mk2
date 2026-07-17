import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'

export function oauthSignupErrorMessage(
  e: unknown,
  messages: {network: string; generic: string},
): string | null {
  const errMsg = String(e)
  if (errMsg.includes('cancelled') || errMsg.includes('dismiss')) {
    return null
  }
  if (isNetworkError(e)) {
    logger.warn('Failed to start OAuth signup due to network error', {
      error: errMsg,
    })
    return messages.network
  }
  logger.warn('Failed to start OAuth signup', {error: errMsg})
  return cleanError(errMsg) || messages.generic
}

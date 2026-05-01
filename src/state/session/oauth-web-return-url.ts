const OAUTH_RETURN_URL_KEY = 'oauth_return_url'
const OAUTH_CALLBACK_ERROR_KEY = 'oauth_callback_error'

export function saveOAuthReturnUrl(url = window.location.href) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(OAUTH_RETURN_URL_KEY, url)
}

export function consumeOAuthReturnUrl() {
  if (typeof window === 'undefined') return undefined

  const savedUrl = window.sessionStorage.getItem(OAUTH_RETURN_URL_KEY)
  window.sessionStorage.removeItem(OAUTH_RETURN_URL_KEY)

  if (!savedUrl) return undefined

  try {
    const url = new URL(savedUrl, window.location.origin)
    if (url.origin !== window.location.origin) return undefined
    if (url.pathname === '/auth/web/callback') return undefined
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

export function saveOAuthCallbackError(error: string) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(OAUTH_CALLBACK_ERROR_KEY, error)
}

export function consumeOAuthCallbackError() {
  if (typeof window === 'undefined') return undefined

  const error = window.sessionStorage.getItem(OAUTH_CALLBACK_ERROR_KEY)
  window.sessionStorage.removeItem(OAUTH_CALLBACK_ERROR_KEY)
  return error || undefined
}

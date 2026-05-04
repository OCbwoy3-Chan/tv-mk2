const OAUTH_RETURN_URL_KEY = 'oauth_return_url'
const OAUTH_CALLBACK_ERROR_KEY = 'oauth_callback_error'

function getSessionStorage() {
  if (typeof window === 'undefined') return undefined

  return window.sessionStorage
}

export function saveOAuthReturnUrl(url?: string) {
  const sessionStorage = getSessionStorage()
  if (!sessionStorage) return

  const returnUrl = url ?? window.location.href

  sessionStorage.setItem(OAUTH_RETURN_URL_KEY, returnUrl)
}

export function consumeOAuthReturnUrl() {
  const sessionStorage = getSessionStorage()
  if (!sessionStorage) return undefined

  const savedUrl = sessionStorage.getItem(OAUTH_RETURN_URL_KEY)
  sessionStorage.removeItem(OAUTH_RETURN_URL_KEY)

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
  const sessionStorage = getSessionStorage()
  if (!sessionStorage) return

  sessionStorage.setItem(OAUTH_CALLBACK_ERROR_KEY, error)
}

export function consumeOAuthCallbackError() {
  const sessionStorage = getSessionStorage()
  if (!sessionStorage) return undefined

  const error = sessionStorage.getItem(OAUTH_CALLBACK_ERROR_KEY)
  sessionStorage.removeItem(OAUTH_CALLBACK_ERROR_KEY)
  return error || undefined
}

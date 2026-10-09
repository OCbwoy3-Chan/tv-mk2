import {saveOAuthReturnUrl} from './oauth-web-return-url'

/**
 * Opening a browser tab can suspend an installed PWA before the SDK has
 * prepared the authorization URL, leaving that tab stuck at about:blank.
 */
export function getWebOAuthDisplay(): 'page' | 'popup' {
  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      (window.navigator as Navigator & {standalone?: boolean})?.standalone)
  if (standalone) {
    saveOAuthReturnUrl()
    return 'page'
  }
  return 'popup'
}

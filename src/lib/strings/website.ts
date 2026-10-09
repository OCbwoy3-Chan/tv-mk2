import {sanitizeUrl} from '@braintree/sanitize-url'

export function sanitizeWebsiteForDisplay(website: string): string {
  return website.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export function sanitizeWebsiteForLink(website: string): string {
  const trimmedWebsite = website.trim()
  return sanitizeUrl(trimmedWebsite)
}

export function isValidWebsiteFormat(website: string): boolean {
  const trimmedWebsite = website?.trim() || ''

  if (!trimmedWebsite || trimmedWebsite.length === 0) {
    return true
  }

  if (!/^https:\/\/[^/\\\s]/i.test(trimmedWebsite)) {
    return false
  }

  try {
    const parsedWebsite = new URL(trimmedWebsite)
    return parsedWebsite.protocol === 'https:' && !!parsedWebsite.hostname
  } catch {
    return false
  }
}

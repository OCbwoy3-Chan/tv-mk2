const BSKY_PDS_HOSTNAMES = ['bsky.social', 'staging.bsky.dev']
const BSKY_PDS_SUFFIX = '.bsky.network'
const BRIDGY_FED_HOSTNAME = 'atproto.brid.gy'
const PDS_FAVICON_CANDIDATE_PATHS = ['/favicon.ico']

export function isBskyPdsUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return (
      BSKY_PDS_HOSTNAMES.includes(hostname) ||
      hostname.endsWith(BSKY_PDS_SUFFIX)
    )
  } catch {
    return false
  }
}

export function isBridgedPdsUrl(url: string): boolean {
  try {
    return new URL(url).hostname === BRIDGY_FED_HOSTNAME
  } catch {
    return false
  }
}

export function getFaviconServiceUrl(
  pdsUrl: string,
  faviconService: string,
): string | undefined {
  try {
    const hostname = new URL(pdsUrl).hostname
    return faviconService.replace('(pds)', hostname)
  } catch {
    return undefined
  }
}

export function getPdsFallbackFaviconUrl(pdsUrl: string): string | undefined {
  return getPdsFallbackFaviconUrls(pdsUrl)[0]
}

export function getPdsFallbackFaviconUrls(pdsUrl: string): string[] {
  try {
    const origin = new URL(pdsUrl).origin
    return PDS_FAVICON_CANDIDATE_PATHS.map(path =>
      new URL(path, origin).toString(),
    )
  } catch {
    return []
  }
}

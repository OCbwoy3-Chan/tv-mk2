export function parseThemeUrl(uri: string) {
  try {
    const url = new URL(uri)
    if (
      url.hostname !== 'witchsky.app' &&
      url.hostname !== 'www.witchsky.app'
    ) {
      return
    }
    const match = url.pathname.match(/^\/profile\/([^/]+)\/theme\/([^/]+)\/?$/)
    if (!match) return
    return {
      name: decodeURIComponent(match[1]),
      rkey: decodeURIComponent(match[2]),
    }
  } catch {
    return
  }
}

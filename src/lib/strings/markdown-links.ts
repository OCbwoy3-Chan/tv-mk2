/** Angle destinations protect parentheses; bare destinations allow balanced pairs. */
export const MARKDOWN_LINK_PATTERN =
  /\[[^\]]+\][ \t]*\((<[^<>\r\n]+>|(?:\\.|[^\\()<>\r\n]|\((?:\\.|[^\\()<>\r\n])*\))+)\)/g

/** Remove destination delimiters and Markdown punctuation escapes. */
export function normalizeMarkdownLinkDestination(destination: string): string {
  const uri = (
    destination.startsWith('<') ? destination.slice(1, -1) : destination
  ).replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1')
  return /^(https?:\/\/|mailto:)/.test(uri) ? uri : `https://${uri}`
}

/** Keep parentheses in a URL from closing a generated masked link. */
export function formatMarkdownLinkDestination(uri: string): string {
  const escaped = uri.replace(/\\/g, '\\\\')
  return /[()]/.test(uri) ? `<${escaped}>` : escaped
}

/** Highlight a masked link while leaving its angle delimiters plain. */
export function getMarkdownLinkHighlightRanges(
  raw: string,
  destination: string,
) {
  if (!destination.startsWith('<')) return [{start: 0, end: raw.length}]
  const start = raw.length - destination.length - 1
  return [
    {start: 0, end: start},
    {start: start + 1, end: raw.length - 2},
    {start: raw.length - 1, end: raw.length},
  ]
}

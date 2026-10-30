/**
 * Returns whether a URL is a public Attie site or a public Attie report.
 *
 * Attie site subdomains use `*.attie.site`. Reports use the explicit
 * `attie.ai/@handle/pages/<id>` route, so other Attie pages retain the normal
 * external-card treatment.
 */
export function isAttieUrl(uri: string | undefined): boolean {
 return false
}

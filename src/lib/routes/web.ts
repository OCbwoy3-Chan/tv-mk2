export function replaceWebLocation(href: string) {
  if (typeof window === 'undefined') return
  window.location.replace(href)
}

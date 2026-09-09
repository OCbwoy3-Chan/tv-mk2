import {escapeHtml, resolveTheme, themeColorSets} from '../../../theme/_shared'

type Env = Record<string, never>

export const onRequestGet: PagesFunction<Env> = async context => {
  try {
    const name = String(context.params.name)
    const rkey = String(context.params.rkey)
    const {value, author} = await resolveTheme(name, rkey)
    const count = themeColorSets(value).length
    const subtitle = `${count} ${count === 1 ? 'variant' : 'variants'} · ${author}`
    const description = value.description ?? subtitle
    const url = new URL(context.request.url)
    const image = `${url.origin}/theme-og/${encodeURIComponent(name)}/${encodeURIComponent(rkey)}`
    const meta = `
      <title>${escapeHtml(value.name)} — Witchsky Theme</title>
      <meta name="description" content="${escapeHtml(description)}">
      <meta property="og:type" content="website">
      <meta property="og:title" content="${escapeHtml(value.name)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      <meta property="og:image" content="${escapeHtml(image)}">
      <meta property="og:image:type" content="image/svg+xml">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta name="twitter:card" content="summary_large_image">`
    const response = await context.next()
    if (!response.ok) return response

    const html = (await response.text()).replace('</head>', `${meta}</head>`)
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'content-type': 'text/html; charset=utf-8',
      },
    })
  } catch {
    return context.next()
  }
}

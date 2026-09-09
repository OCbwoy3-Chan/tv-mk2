import {escapeHtml, resolveTheme, themeColorSets} from '../../../theme/_shared'

type Env = {ASSETS?: Fetcher}

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
    if (context.env.ASSETS) {
      const assetUrl = new URL('/index.html', url)
      const response = await context.env.ASSETS.fetch(
        new Request(assetUrl, context.request),
      )
      if (response.ok) {
        const html = (await response.text()).replace(
          '</head>',
          `${meta}</head>`,
        )
        return new Response(html, {
          headers: {
            ...Object.fromEntries(response.headers),
            'content-type': 'text/html; charset=utf-8',
          },
        })
      }
    }
    return new Response(
      `<!doctype html><html><head>${meta}</head><body><main><h1>${escapeHtml(value.name)}</h1><p>${escapeHtml(subtitle)}</p><p>${escapeHtml(description)}</p><a href="${escapeHtml(url.pathname)}">Open in Witchsky</a></main></body></html>`,
      {
        headers: {'content-type': 'text/html; charset=utf-8'},
      },
    )
  } catch {
    return new Response('Theme not found', {status: 404})
  }
}

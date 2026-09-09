import {escapeHtml, resolveTheme, themeColorSets} from '../../theme/_shared'

type Env = Record<string, never>
type Colors = Record<string, string>

const PREVIEW = {x: 630, y: 155, width: 500, height: 320}

function miniApp(colors: Colors, clipPath?: string) {
  const {x, y, width, height} = PREVIEW
  const sidebar = width * 0.27
  const contentX = x + sidebar + 30
  const contentWidth = width - sidebar - 58
  return `<g${clipPath ? ` clip-path="url(#${clipPath})"` : ''}>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escapeHtml(colors.canvas)}"/>
    <rect x="${x}" y="${y}" width="${sidebar}" height="${height}" fill="${escapeHtml(colors.surface)}"/>
    <rect x="${x + 28}" y="${y + 30}" width="88" height="24" rx="12" fill="${escapeHtml(colors.accent)}"/>
    <rect x="${x + 28}" y="${y + 92}" width="88" height="12" rx="6" fill="${escapeHtml(colors.textMuted)}"/>
    <rect x="${x + 28}" y="${y + 124}" width="88" height="12" rx="6" fill="${escapeHtml(colors.textMuted)}"/>
    <rect x="${x + 28}" y="${y + 156}" width="88" height="12" rx="6" fill="${escapeHtml(colors.textMuted)}"/>
    <rect x="${contentX}" y="${y + 30}" width="185" height="22" rx="11" fill="${escapeHtml(colors.text)}"/>
    <rect x="${contentX}" y="${y + 82}" width="${contentWidth}" height="92" rx="20" fill="${escapeHtml(colors.surfaceRaised)}" stroke="${escapeHtml(colors.border)}" stroke-width="4"/>
    <rect x="${contentX}" y="${y + 205}" width="${contentWidth - 70}" height="40" rx="20" fill="${escapeHtml(colors.accent)}"/>
    <rect x="${contentX + contentWidth - 52}" y="${y + 205}" width="52" height="40" rx="20" fill="${escapeHtml(colors.accentSoft)}"/>
  </g>`
}

function truncate(value: string, length: number) {
  const characters = [...value]
  return characters.length > length
    ? `${characters.slice(0, length - 1).join('')}…`
    : value
}

export const onRequestGet: PagesFunction<Env> = async context => {
  try {
    const name = String(context.params.name)
    const rkey = String(context.params.rkey)
    const {value, author} = await resolveTheme(name, rkey)
    const allSets = themeColorSets(value)
    const sets = allSets.slice(0, 4)
    const base = sets[0].colors
    const {x, y, width, height} = PREVIEW
    const slant = 70
    const overlays = sets.slice(1).map((set, index) => {
      const boundaryTop = x + ((index + 1) / sets.length) * width + slant / 2
      const boundaryBottom = boundaryTop - slant
      const clipId = `variant-${index}`
      return {
        definition: `<clipPath id="${clipId}"><polygon points="${boundaryTop},${y} ${x + width + slant},${y} ${x + width + slant},${y + height} ${boundaryBottom},${y + height}"/></clipPath>`,
        preview: miniApp(set.colors, clipId),
      }
    })
    const marker = [
      value.special ? '✦' : '',
      allSets.length > 1 ? `${allSets.length} variants` : '',
    ]
      .filter(Boolean)
      .join('  ')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <clipPath id="preview"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="30"/></clipPath>
        ${overlays.map(item => item.definition).join('')}
      </defs>
      <rect width="1200" height="630" rx="36" fill="${escapeHtml(base.canvas)}"/>
      <rect x="24" y="24" width="1152" height="582" rx="54" fill="none" stroke="${escapeHtml(base.border)}" stroke-width="5"/>
      <text x="76" y="260" fill="${escapeHtml(base.text)}" font-family="system-ui,sans-serif" font-size="62" font-weight="750">${escapeHtml(truncate(value.name, 22))}</text>
      <text x="76" y="326" fill="${escapeHtml(base.textMuted)}" font-family="system-ui,sans-serif" font-size="34">by @${escapeHtml(truncate(author.replace(/^@/, ''), 28))}</text>
      ${marker ? `<text x="76" y="410" fill="${escapeHtml(base.text)}" font-family="system-ui,sans-serif" font-size="32" font-weight="650">${escapeHtml(marker)}</text>` : ''}
      <g clip-path="url(#preview)">
        ${miniApp(base)}
        ${overlays.map(item => item.preview).join('')}
      </g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="30" fill="none" stroke="${escapeHtml(base.border)}" stroke-width="5"/>
    </svg>`
    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=3600',
      },
    })
  } catch {
    return new Response('Theme not found', {status: 404})
  }
}

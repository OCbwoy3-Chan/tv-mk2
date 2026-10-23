const path = require('node:path')
const fs = require('node:fs')

const projectRoot = path.join(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const bskywebStatic = path.join(projectRoot, 'bskyweb/static')
const templatesDir = path.join(projectRoot, 'bskyweb/templates')
const {entrypoints = []} = JSON.parse(
  fs.readFileSync(path.join(distDir, 'asset-manifest.json'), 'utf8'),
)

if (!entrypoints.some(entry => entry.endsWith('.js'))) {
  throw new Error('No JS entrypoints found in dist/asset-manifest.json')
}

const scriptsHtml = entrypoints
  .map(entry => {
    const url = `{{ staticCDNHost }}/${entry.replace(/^\//, '')}`
    if (entry.endsWith('.js')) {
      return `<script defer="defer" src="${url}"></script>`
    }
    if (entry.endsWith('.css')) {
      return `<link rel="stylesheet" href="${url}">`
    }
    return ''
  })
  .filter(Boolean)
  .join('\n')
fs.writeFileSync(path.join(templatesDir, 'scripts.html'), scriptsHtml)

const fontPath = '{{ staticCDNHost }}/static/fonts/'
fs.writeFileSync(
  path.join(templatesDir, 'fonts.html'),
  `<link rel="preload" as="font" type="font/woff2" href="${fontPath}InterVariable.woff2" crossorigin>
<style>
  @font-face {
    font-family: 'InterVariable';
    src: url("${fontPath}InterVariable.woff2") format('woff2');
    font-weight: 300 1000;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'InterVariableItalic';
    src: url("${fontPath}InterVariable-Italic.woff2") format('woff2');
    font-weight: 300 1000;
    font-style: italic;
    font-display: swap;
  }
</style>
`,
)

/** Copies extra routes and assets that are not emitted by Rspack. */
function copyPath(source, target) {
  const sourcePath = path.join(projectRoot, source)
  if (!fs.existsSync(sourcePath)) return
  const targetPath = path.join(projectRoot, target)
  fs.mkdirSync(path.dirname(targetPath), {recursive: true})
  fs.cpSync(sourcePath, targetPath, {recursive: true})
}

copyPath('bskyweb/static/iframe', 'dist/iframe')
copyPath('bskyweb/static/.well-known', 'dist/.well-known')
copyPath('witchsky-static-about', 'dist/about')

/* Remove Metro output left by previous builds. */
for (const directory of ['_expo', 'assets']) {
  fs.rmSync(path.join(bskywebStatic, directory), {recursive: true, force: true})
}
copyPath('dist/static', 'bskyweb/static')

for (const directory of ['dist', 'bskyweb/static']) {
  require('./generate-oauth-metadata').generateOAuthMetadata(
    path.join(projectRoot, directory),
  )
}
console.log(`Web: generated server templates for ${entrypoints.length} entrypoints`)

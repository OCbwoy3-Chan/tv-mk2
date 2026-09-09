const {execFileSync} = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const source = path.join(projectRoot, 'lexicons')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tenna-lexicons-'))

try {
  /*
   * Spaces use experimental formats unsupported by the standard generator.
   * Their runtime schemas live in src/lib/spaces/lexicons.ts; preserve the
   * original protocol documents without feeding them to the standard builder.
   */
  fs.cpSync(source, temporary, {
    recursive: true,
    filter: file => {
      const relative = path.relative(source, file).split(path.sep).join('/')
      return relative !== 'com/atproto/space' && relative !== 'party/tenna/private'
    },
  })
  execFileSync('lex', [
    'build', '--lexicons', temporary, '--out', path.join(projectRoot, 'src/lexicons'),
    '--clear', '--index-file', '--import-ext', '',
  ], {stdio: 'inherit'})
} finally {
  fs.rmSync(temporary, {recursive: true, force: true})
}

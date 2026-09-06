const fs = require('node:fs')
const path = require('node:path')
const {createOAuthMetadata} = require('../src/state/session/oauth-config.ts')

function generateOAuthMetadata(outputDir, options = {}) {
  fs.mkdirSync(outputDir, {recursive: true})
  for (const native of [false, true]) {
    const metadata = createOAuthMetadata({
      baseUrl: process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://witchsky.app',
      clientName: process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Witchsky',
      ...options,
      native,
    })
    fs.writeFileSync(
      path.join(
        outputDir,
        native
          ? 'oauth-client-metadata-native.json'
          : 'oauth-client-metadata.json',
      ),
      JSON.stringify(metadata, null, 2) + '\n',
    )
  }
}
module.exports = {generateOAuthMetadata}
if (require.main === module) {
  require('dotenv').config({quiet: true})
  generateOAuthMetadata(path.resolve(__dirname, '../bskyweb/static'))
}

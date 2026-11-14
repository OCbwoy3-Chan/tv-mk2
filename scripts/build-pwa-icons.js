const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

/** Generates web install icons from the same artwork as the native app. */
async function buildPwaIcons(output) {
  const root = path.resolve(__dirname, '..')
  await fs.mkdir(output, {recursive: true})

  await sharp(path.join(root, 'assets/app-icons/tenna/ios_icon_legacy_light.png'))
    .resize(180, 180)
    .removeAlpha()
    .png()
    .toFile(path.join(output, 'icon-180.png'))

  const logo = sharp(path.join(root, 'assets/logo.png'))
  // Chrome reuses general icons on the splash screen and in Recents.
  for (const size of [192, 512]) {
    await logo.clone()
      .resize(size, size)
      .png()
      .toFile(path.join(output, `icon-${size}.png`))
  }

  const size = 512
  await sharp(path.join(root, 'assets/icon-android-monochrome.png'))
    .resize(size, size)
    .png()
    .toFile(path.join(output, 'icon-monochrome-512.png'))
}

module.exports = {buildPwaIcons}

if (require.main === module) {
  buildPwaIcons(path.resolve(__dirname, '../public/pwa')).catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}

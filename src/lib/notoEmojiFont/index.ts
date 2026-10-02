export const NOTO_EMOJI_FONT = 'WitchskyNotoColorEmoji'
const fontUrl =
  require('../../../assets/fonts/noto-color-emoji/WitchskyNotoColorEmoji.woff2') as string

let loaded = false
let loading: Promise<void> | undefined
let pickerFont: FontFace | undefined

export function isNotoEmojiFontLoaded() {
  return loaded
}

export function loadNotoEmojiFont(): Promise<void> {
  if (!loading) {
    const source = `url("${fontUrl}")`
    const font = new FontFace(NOTO_EMOJI_FONT, source)
    // Emoji Mart puts this family first in its native emoji font stack.
    pickerFont = new FontFace('EmojiMart', source)
    loading = Promise.all([font.load(), pickerFont.load()])
      .then(([face]) => {
        document.fonts.add(face)
        loaded = true
      })
      .catch(error => {
        loading = undefined
        throw error
      })
  }
  return loading
}

/** Update inherited font stacks, including inputs and Emoji Mart's shadow DOM. */
export function setNotoEmojiFontEnabled(enabled: boolean) {
  if (enabled && loaded) {
    document.documentElement.style.setProperty(
      '--noto-emoji-font',
      NOTO_EMOJI_FONT,
    )
    if (pickerFont) document.fonts.add(pickerFont)
  } else {
    document.documentElement.style.removeProperty('--noto-emoji-font')
    if (pickerFont) document.fonts.delete(pickerFont)
  }
}

import {isLoaded, loadAsync} from 'expo-font'

export const NOTO_EMOJI_FONT = 'WitchskyNotoColorEmoji'
export const notoEmojiFontSource = require('../../../assets/fonts/noto-color-emoji/NotoColorEmoji.ttf')

export function isNotoEmojiFontLoaded() {
  return isLoaded(NOTO_EMOJI_FONT)
}

export function loadNotoEmojiFont() {
  return loadAsync(NOTO_EMOJI_FONT, notoEmojiFontSource)
}

/** Native text uses attributed emoji runs instead of browser font stacks. */
export function setNotoEmojiFontEnabled(_enabled: boolean) {}

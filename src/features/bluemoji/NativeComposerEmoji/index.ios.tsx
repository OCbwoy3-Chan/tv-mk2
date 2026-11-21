import {type ViewProps} from 'react-native'
import {requireNativeViewManager} from 'expo-modules-core'

/** Emoji wrapper that restores native layout overrides when detached or recycled. */
export const NativeComposerEmoji: React.ComponentType<ViewProps> =
  requireNativeViewManager('ExpoComposerEmojiLayout', 'ComposerEmoji')

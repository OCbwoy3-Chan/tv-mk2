import * as SystemUI from 'expo-system-ui'
import {type Theme} from '@bsky.app/alf'

import {logger} from '#/logger'
import {IS_NATIVE} from '#/env'

export function setSystemUITheme(themeType: 'theme' | 'lightbox', t: Theme) {
  if (IS_NATIVE) {
    try {
      if (themeType === 'theme') {
        void SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
      } else {
        void SystemUI.setBackgroundColorAsync('black')
      }
    } catch (error) {
      // Can reject with 'The current activity is no longer available' - no big deal
      logger.debug('Could not set system UI theme', {safeMessage: error})
    }
  }
}

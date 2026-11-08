import {useLingui} from '@lingui/react/macro'

import {type AppIconSet} from '#/screens/Settings/AppIconSettings/types'

export function useAppIconSets() {
  const {t: l} = useLingui()

  return {
    defaults: [
      {
        id: 'default_light',
        name: l({context: 'Name of app icon variant', message: 'Light'}),
        iosImage: () =>
          require('../../../../assets/app-icons/tenna/ios_icon_legacy_light.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/tenna/android_icon_legacy_light.png'),
      },
      {
        id: 'default_dark',
        name: l({context: 'Name of app icon variant', message: 'Dark'}),
        iosImage: () =>
          require('../../../../assets/app-icons/tenna/ios_icon_legacy_dark.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/tenna/android_icon_legacy_dark.png'),
      },
      {
        id: 'testflight',
        name: l({context: 'Name of app icon variant', message: 'TestFlight'}),
        iosImage: () =>
          require('../../../../assets/app-icons/tenna/ios_icon_testflight.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/tenna/android_icon_testflight.png'),
      },
    ] satisfies AppIconSet[],
    bluesky: [
      {
        id: 'liquid_glass_bluesky',
        name: l({context: 'Name of app icon variant', message: 'Light'}),
        iosImage: () =>
          require('../../../../assets/app-icons/bsky/ios_icon_bluesky_liquid_glass.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/bsky/android_icon_bluesky_legacy_light.png'),
      },
      {
        id: 'bluesky_dark',
        name: l({context: 'Name of app icon variant', message: 'Dark'}),
        iosImage: () =>
          require('../../../../assets/app-icons/bsky/ios_icon_bluesky_legacy_dark.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/bsky/android_icon_bluesky_legacy_dark.png'),
      },
      {
        id: 'bluesky_testflight',
        name: l({context: 'Name of app icon variant', message: 'TestFlight'}),
        iosImage: () =>
          require('../../../../assets/app-icons/bsky/ios_icon_bluesky_testflight.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/bsky/android_icon_bluesky_testflight.png'),
      },
    ] satisfies AppIconSet[],
    mu: [
      {
        id: 'mu_light',
        name: l({context: 'Name of app icon variant', message: 'Light'}),
        iosImage: () =>
          require('../../../../assets/app-icons/mu/ios_icon_legacy_light.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/mu/android_icon_legacy_light.png'),
      },
      {
        id: 'mu_dark',
        name: l({context: 'Name of app icon variant', message: 'Dark'}),
        iosImage: () =>
          require('../../../../assets/app-icons/mu/ios_icon_legacy_dark.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/mu/android_icon_legacy_dark.png'),
      },
    ] satisfies AppIconSet[],
    roblox: [
      {
        id: 'liquid_glass_o',
        name: l({context: 'Name of app icon variant', message: 'Default'}),
        iosImage: () =>
          require('../../../../assets/app-icons/roblox/ios_icon_roblox.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/roblox/android_icon_roblox.png'),
      },
      {
        id: 'liquid_glass_r',
        name: l({context: 'Name of app icon variant', message: 'The Classic'}),
        iosImage: () =>
          require('../../../../assets/app-icons/roblox/ios_icon_roblox_classic.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/roblox/android_icon_roblox_classic.png'),
      },
      {
        id: 'roblox_hollow',
        name: l({context: 'Name of app icon variant', message: 'The Hollow'}),
        iosImage: () =>
          require('../../../../assets/app-icons/roblox/ios_icon_roblox_hollow.png'),
        androidImage: () =>
          require('../../../../assets/app-icons/roblox/android_icon_roblox_hollow.png'),
      },
    ] satisfies AppIconSet[],
  }
}

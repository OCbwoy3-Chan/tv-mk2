import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {type AppIconSet} from '#/screens/Settings/AppIconSettings/types'
import { IOS_MAJOR_VERSION, IS_IOS } from '#/env'

export function useAppIconSets() {
  const {_} = useLingui()

  return useMemo(() => {
    const defaults = [
      {
        id: 'default_light',
        name: _(msg({context: 'Name of app icon variant', message: 'Light'})),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_legacy_light.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_legacy_light.png`,
          )
        },
      },
      (!IS_IOS || IOS_MAJOR_VERSION < 26) && {
        id: 'default_dark',
        name: _(msg({context: 'Name of app icon variant', message: 'Dark'})),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_legacy_dark.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_legacy_dark.png`,
          )
        },
      },
    ].filter(a=>!!a) satisfies AppIconSet[]

    const liquidGlass = [
      {
        id: 'liquid_glass_r' as AppIconSet['id'],
        name: _(
          msg({
            context: 'Name of app icon variant',
            message: 'Roblox (Late 2015)',
          }),
        ),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_liquid_glass_r.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_liquid_glass_r.png`,
          )
        },
      },
      {
        id: 'liquid_glass_o' as AppIconSet['id'],
        name: _(
          msg({
            context: 'Name of app icon variant',
            message: 'Roblox',
          }),
        ),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_liquid_glass_o.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_liquid_glass_o.png`,
          )
        },
      },
      {
        id: 'liquid_glass_bluesky' as AppIconSet['id'],
        name: _(
          msg({
            context: 'Name of app icon variant',
            message: 'Bluesky',
          }),
        ),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_bluesky_liquid_glass.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_bluesky_liquid_glass.png`,
          )
        },
      },
    ] satisfies AppIconSet[]

    const testFlight = [
      {
        id: 'testflight' as AppIconSet['id'],
        name: _(
          msg({context: 'Name of app icon variant', message: 'TestFlight'}),
        ),
        iosImage: () => {
          return require(`../../../../assets/app-icons/ios_icon_testflight.png`)
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_testflight.png`,
          )
        },
      },
      {
        id: 'bluesky_testflight' as AppIconSet['id'],
        name: _(
          msg({
            context: 'Name of app icon variant',
            message: 'Bluesky TestFlight',
          }),
        ),
        iosImage: () => {
          return require(
            `../../../../assets/app-icons/ios_icon_bluesky_testflight.png`,
          )
        },
        androidImage: () => {
          return require(
            `../../../../assets/app-icons/android_icon_bluesky_testflight.png`,
          )
        },
      },
    ] satisfies AppIconSet[]

    /**
     * Bluesky+
     */
    // const core = [
    //   {
    //     id: 'core_aurora',
    //     name: _(msg({context: 'Name of app icon variant', message: 'Aurora'})),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_aurora.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_aurora.png`)
    //     },
    //   },
    //   // {
    //   //   id: 'core_bonfire',
    //   //   name: _(msg({ context: 'Name of app icon variant', message: 'Bonfire' })),
    //   //   iosImage: () => {
    //   //     return require(`../../../../assets/app-icons/ios_icon_core_bonfire.png`)
    //   //   },
    //   //   androidImage: () => {
    //   //     return require(`../../../../assets/app-icons/android_icon_core_bonfire.png`)
    //   //   },
    //   // },
    //   {
    //     id: 'core_sunrise',
    //     name: _(msg({context: 'Name of app icon variant', message: 'Sunrise'})),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_sunrise.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_sunrise.png`)
    //     },
    //   },
    //   {
    //     id: 'core_sunset',
    //     name: _(msg({context: 'Name of app icon variant', message: 'Sunset'})),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_sunset.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_sunset.png`)
    //     },
    //   },
    //   {
    //     id: 'core_midnight',
    //     name: _(
    //       msg({context: 'Name of app icon variant', message: 'Midnight'}),
    //     ),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_midnight.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_midnight.png`)
    //     },
    //   },
    //   {
    //     id: 'core_flat_blue',
    //     name: _(
    //       msg({context: 'Name of app icon variant', message: 'Flat Blue'}),
    //     ),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_flat_blue.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_flat_blue.png`)
    //     },
    //   },
    //   {
    //     id: 'core_flat_white',
    //     name: _(
    //       msg({context: 'Name of app icon variant', message: 'Flat White'}),
    //     ),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_flat_white.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_flat_white.png`)
    //     },
    //   },
    //   {
    //     id: 'core_flat_black',
    //     name: _(
    //       msg({context: 'Name of app icon variant', message: 'Flat Black'}),
    //     ),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_flat_black.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_flat_black.png`)
    //     },
    //   },
    //   {
    //     id: 'core_classic',
    //     name: _(
    //       msg({
    //         context: 'Name of app icon variant',
    //         message: 'Bluesky Classic™',
    //       }),
    //     ),
    //     iosImage: () => {
    //       return require(`../../../../assets/app-icons/ios_icon_core_classic.png`)
    //     },
    //     androidImage: () => {
    //       return require(`../../../../assets/app-icons/android_icon_core_classic.png`)
    //     },
    //   },
    // ] satisfies AppIconSet[]

    return {
      defaults,
      liquidGlass,
      testFlight,
      core: [] as AppIconSet[],
    }
  }, [_])
}

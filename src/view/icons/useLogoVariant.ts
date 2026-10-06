import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useAnalytics} from '#/analytics'
import { useTwitterEasterEggEnabled } from '#/state/preferences/twitter-easteregg'

export type LogoVariant = 'default' | 'japan' | 'twitter' | 'kawaii'

export function useLogoVariant(allowVariants = true): LogoVariant {
  const ax = useAnalytics()
  const kawaii = useKawaiiMode()
  const japanLogoEnabled =
    allowVariants &&
    // geolocation.countryCode === 'JP' &&
    ax.features.enabled(ax.features.CustomLogoJapanEnable);

  const twitterLogoEnabled = useTwitterEasterEggEnabled();

  if (twitterLogoEnabled) return 'twitter';
  if (!allowVariants) return 'default'
  if (japanLogoEnabled) return 'japan'
  if (kawaii) return 'kawaii'
  return 'default'
}

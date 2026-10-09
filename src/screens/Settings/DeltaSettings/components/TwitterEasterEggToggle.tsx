import {Trans, useLingui} from '@lingui/react/macro'

import {dynamicActivate} from '#/locale/i18n'
import {dynamicActivate as dynamicActivateWeb} from '#/locale/i18n.web'
import {type AppLanguage} from '#/locale/languages'
import {
  useSetTwitterEasterEggEnabled,
  useTwitterEasterEggEnabled,
} from '#/state/preferences/twitter-easteregg'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {IS_WEB} from '#/env'

export function DeltasJapanLogoToggle() {
  const t = useTheme()

  const {i18n} = useLingui()

  const value = useTwitterEasterEggEnabled()
  const setValue = useSetTwitterEasterEggEnabled()

  return (
    <Toggle.Item
      key={'Twitter'}
      name={'Twitter'}
      label={'Twitter'}
      value={value}
      onChange={next => {
        setValue(next)
        const locale = i18n.locale
        void (IS_WEB
          ? dynamicActivateWeb(locale as AppLanguage)
          : dynamicActivate(locale as AppLanguage))
      }}
      style={[
        a.w_full,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
      ]}>
      <SettingsList.Item>
        <SettingsList.ItemText>
          <Trans>Twitter</Trans>
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}

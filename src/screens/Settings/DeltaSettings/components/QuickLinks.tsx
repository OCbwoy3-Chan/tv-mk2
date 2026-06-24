import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import { DarknerIcon } from '#/components/CrackComponents/Icons'
import {ShieldCheck_Stroke2_Corner0_Rounded} from '#/components/icons/Shield'
import {Separator} from '#/components/Select'
import {Text} from '#/components/Typography'

export function TennaQuickLinks() {
  const t = useTheme()
  const {t: l} = useLingui()

  const sections: {
    title: string
    items: {
      text: string
      path: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon: React.ComponentType<any>
    }[]
  }[] = [
    {
      title: l`Account`,
      items: [
        {
          text: l`Profile badges`,
          path: '/settings/tv/badges',
          icon: DarknerIcon,
        },
        {
          text: l`Moderation labels`,
          path: '/settings/tv/labels',
          icon: ShieldCheck_Stroke2_Corner0_Rounded,
        },
      ],
    },
  ]

  return sections.map(({title, items}, idx) => (
    <View key={idx} style={[idx != 0 && a.pt_lg]}>
      <Text
        style={[
          a.text_md,
          a.font_semi_bold,
          a.pb_md,
          t.atoms.text_contrast_high,
        ]}>
        {title}
      </Text>
      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
        {items.map(({text, path, icon}, idx) => (
          <>
            {idx !== 0 && <Separator key={idx + 'sep'} />}
            <SettingsList.LinkItem key={idx} to={path} label={text}>
              <SettingsList.ItemIcon icon={icon} />
              <SettingsList.ItemText>
                <Trans>{text}</Trans>
              </SettingsList.ItemText>
            </SettingsList.LinkItem>
          </>
        ))}
      </View>
    </View>
  ))
}
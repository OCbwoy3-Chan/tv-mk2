import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {ArrowRotateClockwise_Stroke2_Corner0_Rounded as CloudSyncIcon} from '#/components/icons/ArrowRotate'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Eye_Stroke2_Corner0_Rounded as VisibilityIcon} from '#/components/icons/Eye'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Lab_Stroke2_Corner0_Rounded as BeakerIcon} from '#/components/icons/Lab'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import {RunesScreenLayout} from './components/RunesScreenLayout'

type Props = NativeStackScreenProps<CommonNavigatorParams>

export function RunesSettingsScreen({}: Props) {
  const {t: l} = useLingui()

  return (
    <RunesScreenLayout titleText={l`Runes`}>
      <SettingsList.LinkItem to="/settings/runes/menus" label={l`Menus`}>
        <SettingsList.ItemIcon icon={EllipsisIcon} />
        <SettingsList.ItemText>
          <Trans>Menus</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings/runes/badges" label={l`Badges`}>
        <SettingsList.ItemIcon icon={VerifiedIcon} />
        <SettingsList.ItemText>
          <Trans>Badges</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings/runes/impressions"
        label={l`Impressions`}>
        <SettingsList.ItemIcon icon={VisibilityIcon} />
        <SettingsList.ItemText>
          <Trans>Impressions</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings/runes/usability"
        label={l`Usability`}>
        <SettingsList.ItemIcon icon={AtomIcon} />
        <SettingsList.ItemText>
          <Trans>Usability</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings/runes/display" label={l`Display`}>
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>
          <Trans>Display</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings/runes/infrastructure"
        label={l`Infrastructure`}>
        <SettingsList.ItemIcon icon={EarthIcon} />
        <SettingsList.ItemText>
          <Trans>Infrastructure</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings/runes/settings-sync"
        label={l`Cloud sync`}>
        <SettingsList.ItemIcon icon={CloudSyncIcon} />
        <SettingsList.ItemText>
          <Trans>Settings sync</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings/runes/extra"
        label={l`Extra settings `}>
        <SettingsList.ItemIcon icon={BeakerIcon} />
        <SettingsList.ItemText>
          <Trans>Extra</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
    </RunesScreenLayout>
  )
}

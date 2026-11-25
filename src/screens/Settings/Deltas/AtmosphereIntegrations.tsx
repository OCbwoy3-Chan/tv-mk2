import {useLingui} from '@lingui/react/macro'

import {DeltasSettingItem} from '#/screens/Settings/Deltas/components/DeltasSettingItem'
import {RunesScreenLayout} from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import {MusicNote_Stroke2_Corner0_Rounded as MusicNoteIcon} from '#/components/icons/MusicNote'

export function DeltasAtmosphereIntegrationsSettingsScreen() {
  const {t: l} = useLingui()

  return (
    <RunesScreenLayout titleText={l`Atmosphere`}>
      <DeltasSettingItem
        setting={{
          type: 'toggle',
          label: l`Show teal.fm song status`,
          value: 'showTealNowPlaying',
          info: l`Shows what song a user is currently listening to on teal.fm.`,
          icon: MusicNoteIcon,
        }}
      />
    </RunesScreenLayout>
  )
}

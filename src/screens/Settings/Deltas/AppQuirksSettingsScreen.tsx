import { Trans, useLingui } from '@lingui/react/macro'

import { DeltasSettingItem } from '#/screens/Settings/Deltas/components/DeltasSettingItem'
import { type DeltasSetting } from '#/screens/Settings/Deltas/components/types'
import { RunesScreenLayout } from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag'
import { InlineLinkText } from '#/components/Link'
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass'

export function DeltasAppQuirksSettingsScreen() {
  const { t: l } = useLingui()
  const settings: DeltasSetting[] = [
    {
      type: 'toggle',
      label: l`Even more customizable post TIDs`,
      value: 'evenMoreCustomizablePostTids',
      info: (
        <Trans>
          Offends ATProto by letting you make posts with TIDs like{' '}
          <InlineLinkText
            to="/profile/did:web:vessel.darkworld.download/post/deltarunetmrw"
            label={l`Post by Kris with the deltarunetmrw TID`}>
            deltarunetmrw
          </InlineLinkText>.
          Customizable in the composer.
        </Trans>
      ),
      icon: HashtagIcon,
    },
    {
      type: 'toggle',
      label: l`Eurosky Notifications V2 workaround`,
      value: 'euroskyNotifWorkaround',
      info: (
        <Trans>
          Tries to fix Notifications V2. Specific to Eurosky.
        </Trans>
      ),
      icon: MagnifyingGlassIcon,
    },
  ]

  return (
    <RunesScreenLayout titleText={l`Posting`}>
      {settings.map(setting => (
        <DeltasSettingItem key={setting.value} setting={setting} />
      ))}
    </RunesScreenLayout>
  )
}

import { Trans, useLingui } from '@lingui/react/macro'

import { DeltasSettingItem } from '#/screens/Settings/Deltas/components/DeltasSettingItem'
import { ImportNotificationSettings } from '#/screens/Settings/Deltas/components/ImportNotificationSettings'
import { type DeltasSetting } from '#/screens/Settings/Deltas/components/types'
import { RunesScreenLayout } from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import { BellRinging_Stroke2_Corner0_Rounded as BellIcon } from '#/components/icons/Bell'
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag'
import { InlineLinkText } from '#/components/Link'

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
      label: l`Eurosky notification workaround`,
      value: 'euroskyNotifWorkaround',
      info: l`Eurosky refuses to implement Notifications V2. Requires Eurosky to be selected as your AppView.`,
      icon: BellIcon,
    },
  ]

  return (
    <RunesScreenLayout titleText={l`App`}>
      {settings.map(setting => (
        <DeltasSettingItem key={setting.value} setting={setting} />
      ))}
      <ImportNotificationSettings />
    </RunesScreenLayout>
  )
}

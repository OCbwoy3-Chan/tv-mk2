import {useLingui} from '@lingui/react/macro'

import {DeltasSettingItem} from '#/screens/Settings/Deltas/components/DeltasSettingItem'
import {type DeltasSetting} from '#/screens/Settings/Deltas/components/types'
import {RunesScreenLayout} from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {Shield_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'

export function DeltasModerationSettingsScreen() {
  const {t: l} = useLingui()
  const settings: DeltasSetting[] = [
    {
      type: 'toggle',
      label: l`Show blocked messages`,
      value: 'showBlockedMessages',
      info: l`Show group chat messages from users blocking you.`,
      icon: MessageIcon,
    },
    {
      type: 'toggle',
      label: l`Show hidden lists`,
      value: 'showHiddenList',
      info: l`Show lists hidden by Bluesky Moderation or subscribed labelers.`,
      icon: ListIcon,
    },
    {
      type: 'toggle',
      label: l`Show MDNI badge`,
      value: 'showMdniBadge',
      info: l`Adds a badge to self-identified MDNI (Minors Do Not Interact) accounts without an 🔞 emoji in their name. Has false positives & negatives.`,
      icon: ShieldIcon,
    },
  ]

  return (
    <RunesScreenLayout titleText={l`Moderation`}>
      {settings.map(setting => (
        <DeltasSettingItem key={setting.value} setting={setting} />
      ))}
    </RunesScreenLayout>
  )
}

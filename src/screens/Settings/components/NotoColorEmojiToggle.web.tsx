import {useLingui} from '@lingui/react/macro'

import {
  useNotoColorEmoji,
  useSetNotoColorEmoji,
} from '#/state/preferences/noto-color-emoji-context'
import * as Toggle from '#/components/forms/Toggle'
import {EmojiSmile_Stroke2_Corner0_Rounded as EmojiIcon} from '#/components/icons/Emoji'
import * as SettingsList from './SettingsList'

export function NotoColorEmojiToggle() {
  const {t: l} = useLingui()
  const enabled = useNotoColorEmoji()
  const setEnabled = useSetNotoColorEmoji()

  return (
    <Toggle.Item
      name="noto_color_emoji"
      testID="notoColorEmojiToggle"
      label={l`Use Noto Color Emoji 🤨🥰`}
      value={enabled}
      onChange={setEnabled}>
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={EmojiIcon} />
        <SettingsList.ItemText emoji>
          {l`Use Noto Color Emoji 🤨🥰`}
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}

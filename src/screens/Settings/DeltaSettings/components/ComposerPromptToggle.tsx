import {Trans} from '@lingui/react/macro'

import {
  useHideComposerPrompt,
  useSetHideComposerPrompt,
} from '#/state/preferences'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'

export function DeltasComposerPromptToggle() {
  const t = useTheme()

  const hideComposerPrompt = useHideComposerPrompt()
  const setHideComposerPrompt = useSetHideComposerPrompt()

  return (
    <Toggle.Item
      key={'hide_composer_prompt'}
      name={'Hide composer prompt'}
      label={'Hide composer prompt'}
      value={hideComposerPrompt}
      onChange={next => setHideComposerPrompt(next)}
      style={[
        a.w_full,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
      ]}>
      <SettingsList.Item>
        <SettingsList.ItemText>
          <Trans>Hide composer prompt</Trans>
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}

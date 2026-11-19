import { Trans, useLingui } from '@lingui/react/macro'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { RunesScreenLayout } from '#/screens/Settings/RunesSettings/components/RunesScreenLayout'
import * as Toggle from '#/components/forms/Toggle'
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag'
import { useDeltasPreferences, useSetDeltasPreference } from '#/deltas/preferences'
import { Admonition } from '#/components/Admonition'
import { atoms as a } from '#/alf'
import { InlineLinkText } from '#/components/Link'

export function DeltasPostingSettingsScreen() {
  const { t: l } = useLingui()
  const preferences = useDeltasPreferences()
  const setPreference = useSetDeltasPreference()

  return (
    <RunesScreenLayout titleText={l`Posting`}>
      <Toggle.Item
        testID="evenMoreCustomizablePostTidsToggle"
        name="even_more_customizable_post_tids"
        label={l`Even more customizable post TIDs`}
        value={preferences.evenMoreCustomizablePostTids}
        onChange={value => setPreference('evenMoreCustomizablePostTids', value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={HashtagIcon} />
          <SettingsList.ItemText>
            <Trans>Even more customizable post TIDs</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Offends ATProto by letting you make posts with TIDs like{" "}
            <InlineLinkText
              to="/profile/did:web:vessel.darkworld.download/post/deltarunetmrw"
              label={l`Post by Kris with the deltarunetmrw TID`}
            >
              deltarunetmrw
            </InlineLinkText>.
            Customizable in the composer.
          </Trans>
        </Admonition>
      </SettingsList.Item>
    </RunesScreenLayout>
  )
}

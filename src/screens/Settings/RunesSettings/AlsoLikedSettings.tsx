import {Trans, useLingui} from '@lingui/react/macro'

import {
  useAlsoLikedCollapseByDefault,
  useAlsoLikedFeedEnabled,
  useSetAlsoLikedCollapseByDefault,
  useSetAlsoLikedFeedEnabled,
} from '#/state/preferences'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {SimpleInlineLinkText} from '#/components/Link'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesDisplayAlsoLikedSettingsScreen() {
  const {t: l} = useLingui()

  const alsoLikedFeedEnabled = useAlsoLikedFeedEnabled()
  const setAlsoLikedFeedEnabled = useSetAlsoLikedFeedEnabled()

  const alsoLikedCollapseByDefault = useAlsoLikedCollapseByDefault()
  const setAlsoLikedCollapseByDefault = useSetAlsoLikedCollapseByDefault()

  return (
    <RunesScreenLayout titleText={l`Also liked`}>
      <Toggle.Item
        name="also_liked_feed"
        label={l`Show "Also liked" recommendations under post replies`}
        value={alsoLikedFeedEnabled}
        onChange={value => setAlsoLikedFeedEnabled(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={HeartIcon} />
          <SettingsList.ItemText>
            <Trans>Show "Also liked" recommendations under post replies</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="also_liked_collapsed_by_default"
        label={l`Collapse "Also liked" by default`}
        value={alsoLikedCollapseByDefault}
        onChange={value => setAlsoLikedCollapseByDefault(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ChevronDownIcon} />
          <SettingsList.ItemText>
            <Trans>Collapse "Also liked" by default</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Powered by the{' '}
            <SimpleInlineLinkText
              to="/profile/spacecowboy17.bsky.social/feed/for-you"
              label={l`For You`}>
              For You
            </SimpleInlineLinkText>{' '}
            feed. Posts must have likes, reposts, or have been created in the
            last 90 days to appear. The poster is counted as a liker. Learn more
            at{' '}
            <SimpleInlineLinkText
              to="https://foryou.club/"
              label={l`for you dot club`}>
              foryou.club
            </SimpleInlineLinkText>
          </Trans>
        </Admonition>
      </SettingsList.Item>
    </RunesScreenLayout>
  )
}

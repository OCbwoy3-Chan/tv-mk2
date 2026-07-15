import {Trans, useLingui} from '@lingui/react/macro'

import {
  useGoLinksEnabled,
  useSetGoLinksEnabled,
  useSetShowGermDmButton,
  useShowGermDmButton,
} from '#/state/preferences'
import {
  useConfirmFollowUnfollow,
  useSetConfirmFollowUnfollow,
} from '#/state/preferences/confirm-follow-unfollow'
import {
  useDisableVerifyEmailReminder,
  useSetDisableVerifyEmailReminder,
} from '#/state/preferences/disable-verify-email-reminder'
import {
  useHideScaryFollowButtons,
  useSetHideScaryFollowButtons,
} from '#/state/preferences/hide-scary-follow-buttons'
import {
  useHideSimilarAccountsRecomm,
  useSetHideSimilarAccountsRecomm,
} from '#/state/preferences/hide-similar-accounts-recommendations'
import {
  useSetShowStandardLabelerProfile,
  useShowStandardLabelerProfile,
} from '#/state/preferences/show-standard-labeler-profile'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {Newspaper_Stroke2_Corner2_Rounded as NewspaperIcon} from '#/components/icons/Newspaper'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Shield_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesUsabilitySettingsScreen() {
  const {t: l} = useLingui()

  const goLinksEnabled = useGoLinksEnabled()
  const setGoLinksEnabled = useSetGoLinksEnabled()

  const hideSimilarAccountsRecomm = useHideSimilarAccountsRecomm()
  const setHideSimilarAccountsRecomm = useSetHideSimilarAccountsRecomm()

  const hideScaryFollowButtons = useHideScaryFollowButtons()
  const setHideScaryFollowButtons = useSetHideScaryFollowButtons()

  const showGermDmButton = useShowGermDmButton()
  const setShowGermDmButton = useSetShowGermDmButton()

  const showStandardLabelerProfile = useShowStandardLabelerProfile()
  const setShowStandardLabelerProfile = useSetShowStandardLabelerProfile()

  const confirmFollowUnfollow = useConfirmFollowUnfollow()
  const setConfirmFollowUnfollow = useSetConfirmFollowUnfollow()

  const disableVerifyEmailReminder = useDisableVerifyEmailReminder()
  const setDisableVerifyEmailReminder = useSetDisableVerifyEmailReminder()

  return (
    <RunesScreenLayout titleText={l`Usability`}>
      <SettingsList.LinkItem
        to="/settings/runes/usability/feeds"
        label={l`Feeds`}>
        <SettingsList.ItemIcon icon={NewspaperIcon} />
        <SettingsList.ItemText>
          <Trans>Feeds</Trans>
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <Toggle.Item
        name="use_go_links"
        label={l`Redirect through go.bsky.app`}
        value={goLinksEnabled ?? false}
        onChange={value => setGoLinksEnabled(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ArrowShareRightIcon} />
          <SettingsList.ItemText>
            <Trans>Redirect through go.bsky.app</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="disable_similar_accounts_recommendations"
        label={l`Disable similar accounts recommendations`}
        value={hideSimilarAccountsRecomm}
        onChange={value => setHideSimilarAccountsRecomm(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={PersonGroupIcon} />
          <SettingsList.ItemText>
            <Trans>Disable similar accounts recommendations</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="hide_scary_follow_buttons"
        label={l`Hide follow button on posts and scrolled profile header`}
        value={hideScaryFollowButtons}
        onChange={value => setHideScaryFollowButtons(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={PlusIcon} />
          <SettingsList.ItemText>
            <Trans>
              Hide follow button on posts and scrolled profile header
            </Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="show_germ_dm_button"
        label={l`Show Germ DM button on profiles`}
        value={showGermDmButton}
        onChange={value => setShowGermDmButton(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={MessageIcon} />
          <SettingsList.ItemText>
            <Trans>Show Germ DM button on profiles</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="show_standard_labeler_profile"
        label={l`Show standard profile UI on labeler accounts`}
        value={showStandardLabelerProfile}
        onChange={value => setShowStandardLabelerProfile(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ShieldIcon} />
          <SettingsList.ItemText>
            <Trans>Show standard profile UI on labeler accounts</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="confirm_follow_unfollow"
        label={l`Confirm before following or unfollowing`}
        value={confirmFollowUnfollow ?? false}
        onChange={value => setConfirmFollowUnfollow(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={CheckIcon} />
          <SettingsList.ItemText>
            <Trans>Confirm before following or unfollowing</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="disable_verify_email_reminder"
        label={l`Disable verify email reminder`}
        value={disableVerifyEmailReminder}
        onChange={value => setDisableVerifyEmailReminder(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={EnvelopeIcon} />
          <SettingsList.ItemText>
            <Trans>Disable verify email reminder</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="warning" style={[a.flex_1]}>
          <Trans>
            This only gets rid of the reminder on app launch, useful if your PDS
            does not have email verification setup.&nbsp;This does NOT give
            access to features locked behind email verification.
          </Trans>
        </Admonition>
      </SettingsList.Item>
    </RunesScreenLayout>
  )
}

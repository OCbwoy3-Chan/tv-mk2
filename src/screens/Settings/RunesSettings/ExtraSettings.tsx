import {Trans, useLingui} from '@lingui/react/macro'

import {
  useAutoLikeOnRepost,
  useSetAutoLikeOnRepost,
} from '#/state/preferences/auto-like-on-repost.tsx'
import {
  useDirectFetchRecords,
  useSetDirectFetchRecords,
} from '#/state/preferences/direct-fetch-records'
import {
  useDisableViaRepostNotification,
  useSetDisableViaRepostNotification,
} from '#/state/preferences/disable-via-repost-notification'
import {
  useDiscoverContextEnabled,
  useSetDiscoverContextEnabled,
} from '#/state/preferences/discover-context-enabled'
import {
  useOmitViaField,
  useSetOmitViaField,
} from '#/state/preferences/omit-via-field'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import {CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon} from '#/components/icons/CodeBrackets'
import {Explosion_Stroke2_Corner0_Rounded as ExplosionIcon} from '#/components/icons/Explosion'
import {Eye_Stroke2_Corner0_Rounded as VisibilityIcon} from '#/components/icons/Eye'
import {LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon} from '#/components/icons/Heart2'
import {Lab_Stroke2_Corner0_Rounded as BeakerIcon} from '#/components/icons/Lab'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesExtraSettingsScreen() {
  const {t: l} = useLingui()

  const directFetchRecords = useDirectFetchRecords()
  const setDirectFetchRecords = useSetDirectFetchRecords()

  const autoLikeOnRepost = useAutoLikeOnRepost()
  const setAutoLikeOnRepost = useSetAutoLikeOnRepost()

  const disableViaRepostNotification = useDisableViaRepostNotification()
  const setDisableViaRepostNotification = useSetDisableViaRepostNotification()

  const discoverContextEnabled = useDiscoverContextEnabled()
  const setDiscoverContextEnabled = useSetDiscoverContextEnabled()

  const omitViaField = useOmitViaField()
  const setOmitViaField = useSetOmitViaField()
  const [devMode, setDevMode] = useDevMode()

  return (
    <RunesScreenLayout titleText={l`Extra`}>
      <Toggle.Item
        name="direct_fetch_records"
        label={l`Fetch records directly from PDS to fix broken quotes`}
        value={directFetchRecords}
        onChange={value => setDirectFetchRecords(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={VisibilityIcon} />
          <SettingsList.ItemText>
            <Trans>Fetch records directly from PDS to fix broken quotes</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="auto_like_on_repost"
        label={l`Auto-like what you repost`}
        value={autoLikeOnRepost}
        onChange={value => setAutoLikeOnRepost(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={LikeRepostIcon} />
          <SettingsList.ItemText>
            <Trans>Auto-like what you repost</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="disable_via_repost_notification"
        label={l`Disable via repost notifications`}
        value={disableViaRepostNotification}
        onChange={value => setDisableViaRepostNotification(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={BellRingingIcon} />
          <SettingsList.ItemText>
            <Trans>Disable via repost notifications</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Forcefully disables the notifications other people receive when you
            like/repost a post someone else has reposted for privacy.
          </Trans>
        </Admonition>
      </SettingsList.Item>
      <Toggle.Item
        name="discover_context"
        label={l`Show debug context for posts in Discover feed`}
        value={discoverContextEnabled}
        onChange={value => setDiscoverContextEnabled(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={BeakerIcon} />
          <SettingsList.ItemText>
            <Trans>Show debug context for posts in Discover feed</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="omit_via_field"
        label={l`Don't include the 'via' field in own posts`}
        value={omitViaField}
        onChange={value => setOmitViaField(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ExplosionIcon} />
          <SettingsList.ItemText>
            <Trans>Don't include the 'via' field in own posts</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        name="dev_mode"
        label={l`Developer mode`}
        value={devMode}
        onChange={value => setDevMode(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={CodeBracketsIcon} />
          <SettingsList.ItemText>
            <Trans>Developer mode</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
    </RunesScreenLayout>
  )
}

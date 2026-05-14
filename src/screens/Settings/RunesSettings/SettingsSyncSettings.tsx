import {useCallback, useState} from 'react'
import {TextInput, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import * as persisted from '#/state/persisted'
import {
  useSetSettingsSyncEnabled,
  useSettingsSyncEnabled,
} from '#/state/preferences'
import {useStorageManifestQuery} from '#/state/queries/storage-manifest'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {ArrowRotateClockwise_Stroke2_Corner0_Rounded as CloudSyncIcon} from '#/components/icons/ArrowRotate'
import {Key_Stroke2_Corner2_Rounded as KeyIcon} from '#/components/icons/Key'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {
  usePullFromCloud,
  usePushToCloud,
  useSettingsSyncStatus,
} from '#/features/settingsSync'
import {RunesScreenLayout} from './components/RunesScreenLayout'

function formatStatusLine(
  status: ReturnType<typeof useSettingsSyncStatus>,
): string | null {
  if (status.type === 'idle') return null
  if (status.type === 'pushing') return 'Saving to cloud…'
  if (status.type === 'pulling') return 'Loading from cloud…'
  if (status.type === 'pushed')
    return `Saved to cloud at ${status.at.toLocaleTimeString()}`
  if (status.type === 'pulled')
    return `Loaded from cloud at ${status.at.toLocaleTimeString()}`
  if (status.type === 'error') return `Error: ${status.message}`
  return null
}

export function RunesSettingsSyncSettingsScreen() {
  const {t: l} = useLingui()
  const t = useTheme()

  const {hasSession} = useSession()
  const enabled = useSettingsSyncEnabled()
  const setEnabled = useSetSettingsSyncEnabled()

  const status = useSettingsSyncStatus()
  const pushToCloud = usePushToCloud()
  const pullFromCloud = usePullFromCloud()

  const manifestQuery = useStorageManifestQuery({enabled: hasSession})
  const decodedJson =
    manifestQuery.data != null
      ? JSON.stringify(manifestQuery.data, null, 2)
      : null

  const isBusy = status.type === 'pushing' || status.type === 'pulling'
  const isError = status.type === 'error'

  const statusLine = formatStatusLine(status)

  const [syncApiKey, setSyncApiKey] = useState<boolean>(
    () => persisted.get('syncOpenRouterApiKey') ?? false,
  )
  const onToggleSyncApiKey = useCallback((next: boolean) => {
    setSyncApiKey(next)
    persisted.write('syncOpenRouterApiKey', next)
  }, [])

  const onToggleEnabled = (next: boolean) => {
    setEnabled(next)
    // Immediately push when the user first enables sync
    if (next) {
      pushToCloud()
    }
  }

  return (
    <RunesScreenLayout titleText={l`Settings sync`}>
      <Toggle.Item
        name="cloud_sync_enabled"
        label={l`Sync settings between devices`}
        value={enabled}
        onChange={onToggleEnabled}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={CloudSyncIcon} />
          <SettingsList.ItemText>
            <Trans>Sync settings between devices</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>

      {enabled && (
        <Toggle.Item
          name="cloud_sync_api_key"
          label={l`Sync OpenRouter API Key`}
          value={syncApiKey}
          onChange={onToggleSyncApiKey}>
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={KeyIcon} />
            <SettingsList.ItemText>
              <Trans>Include OpenRouter API Key in synced settings</Trans>
            </SettingsList.ItemText>
            <Toggle.Platform />
          </SettingsList.Item>
        </Toggle.Item>
      )}

      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Settings are encoded and stored in a hidden draft post on your
            account. This lets you sync your Witchsky preferences across devices
            without any external service. Your session credentials are never
            included.
          </Trans>
        </Admonition>
      </SettingsList.Item>

      {enabled && (
        <>
          <SettingsList.Divider />

          <SettingsList.Item>
            <View style={[a.flex_1, a.gap_md, IS_WEB && a.flex_row]}>
              <Button
                label={l`Push settings to cloud`}
                size="small"
                color="primary"
                disabled={isBusy}
                onPress={pushToCloud}
                style={IS_WEB ? undefined : [a.flex_1]}>
                <ButtonText>
                  <Trans>Push</Trans>
                </ButtonText>
              </Button>
              <Button
                label={l`Load settings from cloud`}
                size="small"
                color="secondary"
                disabled={isBusy}
                onPress={pullFromCloud}
                style={IS_WEB ? undefined : [a.flex_1]}>
                <ButtonText>
                  <Trans>Load</Trans>
                </ButtonText>
              </Button>
            </View>
          </SettingsList.Item>

          {statusLine && (
            <SettingsList.Item>
              <Text
                style={[
                  a.text_sm,
                  a.flex_1,
                  isError
                    ? {color: t.palette.negative_500}
                    : t.atoms.text_contrast_medium,
                ]}>
                {statusLine}
              </Text>
            </SettingsList.Item>
          )}

          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>
                Loading from cloud will overwrite your local settings. Push
                first if you want to preserve changes made on this device.
              </Trans>
            </Admonition>
          </SettingsList.Item>
        </>
      )}

      {hasSession && (
        <>
          <SettingsList.Divider />
          <SettingsList.Item>
            <View style={[a.flex_1, a.gap_xs]}>
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>Cloud data</Trans>
              </Text>
              {manifestQuery.isLoading ? (
                <Text style={[a.text_sm, t.atoms.text_contrast_low]}>
                  <Trans>Loading…</Trans>
                </Text>
              ) : manifestQuery.isError ? (
                <Text style={[a.text_sm, {color: t.palette.negative_500}]}>
                  {String(manifestQuery.error)}
                </Text>
              ) : decodedJson == null ? (
                <Text style={[a.text_sm, t.atoms.text_contrast_low]}>
                  <Trans>No cloud data found.</Trans>
                </Text>
              ) : (
                <TextInput
                  accessibilityLabel={l`Current cloud data`}
                  accessibilityHint=""
                  value={decodedJson}
                  editable={false}
                  multiline
                  scrollEnabled={false}
                  style={[
                    a.text_xs,
                    a.p_sm,
                    a.rounded_sm,
                    t.atoms.text,
                    t.atoms.bg_contrast_25,
                    {fontFamily: 'monospace', minHeight: 300},
                  ]}
                />
              )}
            </View>
          </SettingsList.Item>
        </>
      )}
    </RunesScreenLayout>
  )
}

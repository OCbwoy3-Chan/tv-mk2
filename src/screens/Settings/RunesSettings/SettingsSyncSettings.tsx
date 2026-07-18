import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import * as persisted from '#/state/persisted'
import {
  useSetSettingsSyncEnabled,
  useSettingsSyncEnabled,
} from '#/state/preferences'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {ArrowRotateClockwise_Stroke2_Corner0_Rounded as CloudSyncIcon} from '#/components/icons/ArrowRotate'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPaletteIcon} from '#/components/icons/ColorPalette'
import {Text} from '#/components/Typography'
import {
  useSettingsSyncStatus,
  useSyncAllAccountsState,
  useSyncSettingsToAllAccounts,
} from '#/features/settingsSync'
import {RunesScreenLayout} from './components/RunesScreenLayout'

function formatStatusLine(
  status: ReturnType<typeof useSettingsSyncStatus>,
): string | null {
  if (status.type === 'idle') return null
  if (status.type === 'pushing') return 'Saving to cloud…'
  if (status.type === 'merging') return 'Merging with cloud…'
  if (status.type === 'pushed')
    return `Saved to cloud at ${status.at.toLocaleTimeString()}`
  if (status.type === 'merged')
    return `Merged with cloud at ${status.at.toLocaleTimeString()}`
  if (status.type === 'error') {
    const message = status.message.replace(/^Error:\s*/i, '')
    return `Error: ${message}`
  }
  return null
}

export function RunesSettingsSyncSettingsScreen() {
  const {t: l} = useLingui()
  const t = useTheme()

  const {hasSession, accounts} = useSession()
  const enabled = useSettingsSyncEnabled()
  const setEnabled = useSetSettingsSyncEnabled()

  const status = useSettingsSyncStatus()
  const syncAllState = useSyncAllAccountsState()
  const syncSettingsToAllAccounts = useSyncSettingsToAllAccounts()

  const isBusy = status.type === 'pushing' || status.type === 'merging'
  const isSyncingAll = syncAllState.type === 'running'
  const isError = status.type === 'error'

  const statusLine = formatStatusLine(status)

  const [syncTheme, setSyncTheme] = useState<boolean>(
    () => persisted.get('syncTheme') !== false,
  )
  const onToggleSyncTheme = useCallback((next: boolean) => {
    setSyncTheme(next)
    void persisted.write('syncTheme', next)
  }, [])

  const onToggleEnabled = (next: boolean) => {
    setEnabled(next)
  }

  const syncAllProgress =
    syncAllState.type === 'running' || syncAllState.type === 'done'
      ? syncAllState.progress
      : null
  const syncAllPercent =
    syncAllProgress && syncAllProgress.total > 0
      ? Math.round((syncAllProgress.completed / syncAllProgress.total) * 100)
      : 0

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
          name="cloud_sync_theme"
          label={l`Include theme in synced settings`}
          value={syncTheme}
          onChange={onToggleSyncTheme}>
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={ColorPaletteIcon} />
            <SettingsList.ItemText>
              <Trans>Include theme in synced settings</Trans>
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
            included. Enabling sync loads any existing cloud settings and merges
            them with local changes.
          </Trans>
        </Admonition>
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

      {enabled && hasSession && (
        <>
          <SettingsList.Divider />

          <SettingsList.Item>
            <Button
              label={l`Sync settings to all accounts`}
              size="small"
              color="secondary"
              disabled={isBusy || isSyncingAll || accounts.length === 0}
              onPress={syncSettingsToAllAccounts}
              style={[a.flex_1]}>
              <ButtonText>
                <Trans>Sync settings to all accounts</Trans>
              </ButtonText>
            </Button>
          </SettingsList.Item>

          {syncAllProgress && (
            <SettingsList.Item>
              <View style={[a.flex_1, a.gap_sm]}>
                <View
                  style={[
                    a.w_full,
                    a.rounded_full,
                    a.overflow_hidden,
                    t.atoms.bg_contrast_50,
                    {height: 8},
                  ]}>
                  <View
                    style={[
                      a.rounded_full,
                      {
                        height: 8,
                        width: `${syncAllPercent}%`,
                        backgroundColor: t.palette.primary_500,
                      },
                    ]}
                  />
                </View>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  {isSyncingAll ? (
                    syncAllProgress.currentHandle ? (
                      <Trans>
                        Syncing @{syncAllProgress.currentHandle} (
                        {syncAllProgress.completed}/{syncAllProgress.total})
                      </Trans>
                    ) : (
                      <Trans>
                        Syncing… ({syncAllProgress.completed}/
                        {syncAllProgress.total})
                      </Trans>
                    )
                  ) : syncAllProgress.failures.length > 0 ? (
                    <Trans>
                      Finished {syncAllProgress.completed}/
                      {syncAllProgress.total} ·{' '}
                      {syncAllProgress.failures.length} failed
                    </Trans>
                  ) : (
                    <Trans>
                      Finished {syncAllProgress.completed}/
                      {syncAllProgress.total}
                    </Trans>
                  )}
                </Text>
                {syncAllProgress.failures.map(failure => (
                  <Text
                    key={failure.did}
                    style={[a.text_sm, {color: t.palette.negative_500}]}>
                    @{failure.handle}: {failure.reason}
                  </Text>
                ))}
              </View>
            </SettingsList.Item>
          )}

        </>
      )}
    </RunesScreenLayout>
  )
}

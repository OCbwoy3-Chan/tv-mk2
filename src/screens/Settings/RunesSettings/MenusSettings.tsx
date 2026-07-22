import {useCallback, useRef} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  DEFAULT_ATPROTO_EXPLORER,
  useAtprotoExplorerSetting,
  useSetAtprotoExplorer,
} from '#/state/preferences/atproto-explorer'
import {
  useSetShowClearskyProfileLink,
  useShowClearskyProfileLink,
} from '#/state/preferences/show-clearsky-profile-link'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {ClearskyIcon} from '#/components/icons/services/Clearsky'
import {Text} from '#/components/Typography'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesMenusSettingsScreen() {
  const {t: l} = useLingui()
  const atprotoExplorer = useAtprotoExplorerSetting()
  const setAtprotoExplorer = useSetAtprotoExplorer()
  const showClearskyProfileLink = useShowClearskyProfileLink()
  const setShowClearskyProfileLink = useSetShowClearskyProfileLink()
  const atprotoExplorerRef = useRef(atprotoExplorer)
  atprotoExplorerRef.current = atprotoExplorer

  const updateAtprotoExplorer = useCallback(
    (next: typeof atprotoExplorer) => {
      atprotoExplorerRef.current = next
      setAtprotoExplorer(next)
    },
    [setAtprotoExplorer],
  )

  useFocusEffect(
    useCallback(() => {
      return () => {
        const current = atprotoExplorerRef.current
        const next = {
          name: current.name.trim() || DEFAULT_ATPROTO_EXPLORER.name,
          url: current.url.trim() || DEFAULT_ATPROTO_EXPLORER.url,
        }
        if (next.name !== current.name || next.url !== current.url) {
          updateAtprotoExplorer(next)
        }
      }
    }, [updateAtprotoExplorer]),
  )

  return (
    <RunesScreenLayout titleText={l`Menus`}>
      <SettingsList.Group iconInset={false} contentContainerStyle={[a.gap_md]}>
        <SettingsList.ItemText>
          <Trans>ATProto explorer</Trans>
        </SettingsList.ItemText>
        <Text style={[a.leading_snug]}>
          <Trans>
            Choose the explorer used in Share and Open menus. Use (uri) where 
            a post, profile, or repository AT URI should appear. Leave fields 
            empty to reset to defaults.
          </Trans>
        </Text>
        <View style={[a.w_full]}>
          <TextField.LabelText>
            <Trans>Name</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              label={l`ATProto explorer name`}
              placeholder={l`PDSls`}
              value={atprotoExplorer.name}
              onChangeText={name =>
                updateAtprotoExplorer({...atprotoExplorer, name})
              }
              autoCapitalize="words"
              autoCorrect={false}
            />
          </TextField.Root>
        </View>
        <View style={[a.w_full]}>
          <TextField.LabelText>
            <Trans>Link</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              label={l`ATProto explorer link`}
              placeholder="https://pds.ls/(uri)"
              value={atprotoExplorer.url}
              onChangeText={url =>
                updateAtprotoExplorer({...atprotoExplorer, url})
              }
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="url"
              keyboardType="url"
            />
          </TextField.Root>
        </View>
      </SettingsList.Group>
      <SettingsList.Divider />
      <Toggle.Item
        name="show_clearsky_profile_link"
        label={l`Show Clearsky in profile Open menu`}
        value={showClearskyProfileLink}
        onChange={setShowClearskyProfileLink}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ClearskyIcon} />
          <SettingsList.ItemText>
            <Trans>Show Clearsky in profile Open menu</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
    </RunesScreenLayout>
  )
}

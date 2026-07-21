import {useCallback, useRef} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  DEFAULT_ATPROTO_EXPLORER,
  useAtprotoExplorerSetting,
  useSetAtprotoExplorer,
} from '#/state/preferences/atproto-explorer'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesMenusSettingsScreen() {
  const {t: l} = useLingui()
  const atprotoExplorer = useAtprotoExplorerSetting()
  const setAtprotoExplorer = useSetAtprotoExplorer()
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
            Choose the explorer used by Open menus. Use (uri) where the post,
            profile, or repository AT URI should appear.
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
    </RunesScreenLayout>
  )
}

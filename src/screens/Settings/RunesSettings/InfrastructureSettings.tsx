import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import * as persisted from '#/state/persisted'
import {
  useConstellationInstance,
  useSetConstellationInstance,
} from '#/state/preferences/constellation-instance'
import {
  useImageCdnHost,
  useSetImageCdnHost,
} from '#/state/preferences/image-cdn-host'
import {
  usePlcDirectory,
  useSetPlcDirectory,
} from '#/state/preferences/plc-directory'
import {
  useLibreTranslateInstance,
  useSetLibreTranslateInstance,
  useSetTranslationServicePreference,
  useTranslationServicePreference,
} from '#/state/preferences/translation-service-preference'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Star_Stroke2_Corner0_Rounded as StarIcon} from '#/components/icons/Star'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesInfrastructureSettingsScreen() {
  const {t: l} = useLingui()

  const translationServicePreference = useTranslationServicePreference()
  const setTranslationServicePreference = useSetTranslationServicePreference()
  const setLibreTranslateInstanceControl = Dialog.useDialogControl()

  const imageCdnHost = useImageCdnHost()
  const setImageCdnHostControl = Dialog.useDialogControl()

  const plcDirectory = usePlcDirectory()
  const setPlcDirectoryControl = Dialog.useDialogControl()

  const constellationInstance = useConstellationInstance()
  const setConstellationInstanceControl = Dialog.useDialogControl()

  return (
    <RunesScreenLayout titleText={l`Infrastructure`}>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={EarthIcon} />
        <SettingsList.ItemText>
          <Trans>Post Translation Provider</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="service_google"
          label={l`Use Google Translate`}
          value={translationServicePreference === 'google'}
          onChange={() => setTranslationServicePreference('google')}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Use Google Translate</Trans>
          </Toggle.LabelText>
          <Toggle.Radio />
        </Toggle.Item>
        <Toggle.Item
          name="service_kagi"
          label={l`Use Kagi Translate`}
          value={translationServicePreference === 'kagi'}
          onChange={() => setTranslationServicePreference('kagi')}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Use Kagi Translate</Trans>
          </Toggle.LabelText>
          <Toggle.Radio />
        </Toggle.Item>
        <Toggle.Item
          name="service_papago"
          label={l`Use Naver Papago`}
          value={translationServicePreference === 'papago'}
          onChange={() => setTranslationServicePreference('papago')}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Use Naver Papago</Trans>
          </Toggle.LabelText>
          <Toggle.Radio />
        </Toggle.Item>
        <Toggle.Item
          name="service_libreTranslate"
          label={l`Use LibreTranslate`}
          value={translationServicePreference === 'libreTranslate'}
          onChange={() => setTranslationServicePreference('libreTranslate')}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Use LibreTranslate</Trans>
          </Toggle.LabelText>
          <Toggle.Radio />
        </Toggle.Item>
      </SettingsList.Group>

      {translationServicePreference === 'libreTranslate' && (
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={EarthIcon} />
          <SettingsList.ItemText>
            <Trans>{`LibreTranslate Instance`}</Trans>
          </SettingsList.ItemText>
          <SettingsList.BadgeButton
            label={l`Change`}
            onPress={() => setLibreTranslateInstanceControl.open()}
          />
        </SettingsList.Item>
      )}

      <SettingsList.Divider />

      <SettingsList.Item>
        <SettingsList.ItemIcon icon={EarthIcon} />
        <SettingsList.ItemText>
          <Trans>{`Image CDN`}</Trans>
        </SettingsList.ItemText>
        <SettingsList.BadgeButton
          label={l`Change`}
          onPress={() => setImageCdnHostControl.open()}
        />
      </SettingsList.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Override the CDN host for all images. Current:&nbsp;
            <InlineLinkText to={imageCdnHost} label={imageCdnHost}>
              {imageCdnHost}
            </InlineLinkText>
          </Trans>
        </Admonition>
      </SettingsList.Item>

      <SettingsList.Item>
        <SettingsList.ItemIcon icon={EarthIcon} />
        <SettingsList.ItemText>
          <Trans>{`PLC Directory`}</Trans>
        </SettingsList.ItemText>
        <SettingsList.BadgeButton
          label={l`Change`}
          onPress={() => setPlcDirectoryControl.open()}
        />
      </SettingsList.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Override the PLC directory used to resolve DIDs. Current:&nbsp;
            <InlineLinkText to={plcDirectory} label={plcDirectory}>
              {plcDirectory}
            </InlineLinkText>
          </Trans>
        </Admonition>
      </SettingsList.Item>

      <SettingsList.Item>
        <SettingsList.ItemIcon icon={StarIcon} />
        <SettingsList.ItemText>
          <Trans>{`Constellation Instance`}</Trans>
        </SettingsList.ItemText>
        <SettingsList.BadgeButton
          label={l`Change`}
          onPress={() => setConstellationInstanceControl.open()}
        />
      </SettingsList.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Constellation is used to supplement AppView responses for custom
            verifications and nuclear block bypass, via backlinks. Current
            instance:&nbsp;
            <InlineLinkText
              to={constellationInstance}
              label={constellationInstance}>
              {constellationInstance}
            </InlineLinkText>
          </Trans>
        </Admonition>
      </SettingsList.Item>

      <ConstellationInstanceDialog control={setConstellationInstanceControl} />
      <LibreTranslateInstanceDialog
        control={setLibreTranslateInstanceControl}
      />
      <ImageCdnHostDialog control={setImageCdnHostControl} />
      <PlcDirectoryDialog control={setPlcDirectoryControl} />
    </RunesScreenLayout>
  )
}

function ConstellationInstanceDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const constellationInstance = useConstellationInstance()
  const [url, setUrl] = useState(constellationInstance ?? '')
  const setConstellationInstance = useSetConstellationInstance()

  const submit = () => {
    setConstellationInstance(url)
    control.close()
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setUrl(constellationInstance ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Constellations instance URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Constellations instance URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setUrl}
            placeholder={persisted.defaults.constellationInstance}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={submit}
            accessibilityHint={l`Input the url of the constellations instance to use`}
            defaultValue={constellationInstance}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color="primary"
              disabled={!isValidHostnameUrl(url)}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function LibreTranslateInstanceDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const libreTranslateInstance = useLibreTranslateInstance()
  const [url, setUrl] = useState(libreTranslateInstance ?? '')
  const setLibreTranslateInstance = useSetLibreTranslateInstance()

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setUrl(libreTranslateInstance ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`LibreTranslate instance URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>LibreTranslate instance URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setUrl}
            placeholder={persisted.defaults.libreTranslateInstance}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => {
              setLibreTranslateInstance(url)
              control.close()
            }}
            accessibilityHint={l`Input the url of the LibreTranslate instance to use`}
            defaultValue={libreTranslateInstance}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => {
                setLibreTranslateInstance(url)
                control.close()
              }}
              variant="solid"
              color="primary"
              disabled={!isValidHostnameUrl(url)}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ImageCdnHostDialog({control}: {control: Dialog.DialogControlProps}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const imageCdnHost = useImageCdnHost()
  const [url, setUrl] = useState(imageCdnHost ?? '')
  const setImageCdnHost = useSetImageCdnHost()
  const isReset = url.trim().length === 0

  const submit = () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      control.close(() => {
        setImageCdnHost(undefined)
      })
      return
    }

    control.close(() => {
      try {
        setImageCdnHost(new URL(trimmedUrl).origin)
      } catch {
        setImageCdnHost(trimmedUrl)
      }
    })
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setUrl(imageCdnHost ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Image CDN URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Image CDN URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setUrl}
            placeholder={persisted.defaults.imageCdnHost}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={submit}
            accessibilityHint={l`Input the URL of the image CDN to use`}
            defaultValue={imageCdnHost}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={isReset ? l`Reset` : l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color={isReset ? 'secondary' : 'primary'}
              disabled={!isReset && !isValidHostnameUrl(url)}>
              <ButtonText>
                {isReset ? <Trans>Reset</Trans> : <Trans>Save</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function PlcDirectoryDialog({control}: {control: Dialog.DialogControlProps}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const plcDirectory = usePlcDirectory()
  const [url, setUrl] = useState(plcDirectory ?? '')
  const setPlcDirectory = useSetPlcDirectory()
  const isReset = url.trim().length === 0

  const submit = () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      control.close(() => {
        setPlcDirectory(undefined)
      })
      return
    }

    control.close(() => {
      try {
        setPlcDirectory(new URL(trimmedUrl).origin)
      } catch {
        setPlcDirectory(trimmedUrl)
      }
    })
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setUrl(plcDirectory ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`PLC Directory URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>PLC Directory URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setUrl}
            placeholder={persisted.defaults.plcDirectory}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={submit}
            accessibilityHint={l`Input the URL of the PLC directory to use`}
            defaultValue={plcDirectory}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={isReset ? l`Reset` : l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color={isReset ? 'secondary' : 'primary'}
              disabled={!isReset && !isValidPlcDirectoryUrl(url)}>
              <ButtonText>
                {isReset ? <Trans>Reset</Trans> : <Trans>Save</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function isValidHostnameUrl(url: string) {
  try {
    return new URL(url).hostname.includes('.')
  } catch {
    return false
  }
}

function isValidPlcDirectoryUrl(url: string) {
  try {
    const nextUrl = new URL(url)
    return nextUrl.protocol === 'https:' || nextUrl.protocol === 'http:'
  } catch {
    return false
  }
}

const styles = {
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
}

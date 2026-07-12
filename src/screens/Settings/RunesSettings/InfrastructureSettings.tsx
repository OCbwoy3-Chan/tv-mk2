import {useCallback, useLayoutEffect, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  testConstellationUrl,
  testImageCdnUrl,
  testLibreTranslateUrl,
  testPlcDirectoryUrl,
} from '#/lib/infrastructure/url-test'
import {usePalette} from '#/lib/hooks/usePalette'
import * as persisted from '#/state/persisted'
import {
  useConstellationInstanceSetting,
  useConstellationInstanceCustom,
  useSetConstellationInstance,
  useSetConstellationInstanceCustom,
} from '#/state/preferences/constellation-instance'
import {
  useImageCdnHostSetting,
  useImageCdnHostCustom,
  useSetImageCdnHost,
  useSetImageCdnHostCustom,
} from '#/state/preferences/image-cdn-host'
import {
  usePlcDirectorySetting,
  usePlcDirectoryCustom,
  useSetPlcDirectory,
  useSetPlcDirectoryCustom,
} from '#/state/preferences/plc-directory'
import {
  useLibreTranslateInstanceSetting,
  useSetLibreTranslateInstance,
  useSetTranslationServicePreference,
  useTranslationServicePreference,
} from '#/state/preferences/translation-service-preference'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import * as Select from '#/components/Select'
import * as Toggle from '#/components/forms/Toggle'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {RunesScreenLayout} from './components/RunesScreenLayout'

const IMAGE_CDN_PRESETS = [
  'https://porxie-bsky.dollware.net',
  'https://cdn.blueat.network',
] as const

const APP_SERVER_CDN_ORIGIN = 'https://cdn.bsky.app'

const LIBRETRANSLATE_DEFAULT_ORIGIN = 'https://libretranslate.com'

const PLC_DIRECTORY_PRESETS = [
  'https://plc.directory',
  'https://plc.eurosky.network',
  'https://plc.wafflehouse.dev',
] as const

const CONSTELLATION_PRESETS = [
  'https://constellation.microcosm.blue',
  'https://constellation.wafflehouse.dev',
] as const

export function RunesInfrastructureSettingsScreen() {
  const {t: l} = useLingui()

  const translationServicePreference = useTranslationServicePreference()
  const setTranslationServicePreference = useSetTranslationServicePreference()
  const setLibreTranslateInstanceControl = Dialog.useDialogControl()

  const imageCdnHostSetting = useImageCdnHostSetting()
  const setImageCdnHost = useSetImageCdnHost()
  const setImageCdnHostControl = Dialog.useDialogControl()
  const [imageCdnDialogSession, setImageCdnDialogSession] = useState(0)

  const plcDirectorySetting = usePlcDirectorySetting()
  const setPlcDirectory = useSetPlcDirectory()
  const setPlcDirectoryControl = Dialog.useDialogControl()
  const [plcDirectoryDialogSession, setPlcDirectoryDialogSession] = useState(0)

  const constellationInstanceSetting = useConstellationInstanceSetting()
  const setConstellationInstance = useSetConstellationInstance()
  const setConstellationInstanceControl = Dialog.useDialogControl()
  const [constellationDialogSession, setConstellationDialogSession] =
    useState(0)

  const openImageCdnCustomDialog = () => {
    setImageCdnDialogSession(session => session + 1)
    setImageCdnHostControl.open()
  }

  const openPlcDirectoryCustomDialog = () => {
    setPlcDirectoryDialogSession(session => session + 1)
    setPlcDirectoryControl.open()
  }

  const openConstellationCustomDialog = () => {
    setConstellationDialogSession(session => session + 1)
    setConstellationInstanceControl.open()
  }

  const imageCdnSelectValue = getImageCdnSelectValue(imageCdnHostSetting)
  const plcDirectorySelectValue = getPlcDirectorySelectValue(plcDirectorySetting)
  const constellationSelectValue = getConstellationSelectValue(
    constellationInstanceSetting,
  )

  const imageCdnItems = [
    {value: 'default', label: l`App server default`},
    {value: IMAGE_CDN_PRESETS[0], label: l`Dollware Porxie`},
    {value: IMAGE_CDN_PRESETS[1], label: l`Blueat`},
    {value: 'custom', label: l`Custom`},
  ]

  const plcDirectoryItems = [
    {value: PLC_DIRECTORY_PRESETS[0], label: l`plc.directory`},
    {value: PLC_DIRECTORY_PRESETS[1], label: l`Eurosky`},
    {value: PLC_DIRECTORY_PRESETS[2], label: l`Wafflehouse.dev`},
    {value: 'custom', label: l`Custom`},
  ]

  const constellationItems = [
    {value: CONSTELLATION_PRESETS[0], label: l`microcosm.blue`},
    {value: CONSTELLATION_PRESETS[1], label: l`Wafflehouse.dev`},
    {value: 'custom', label: l`Custom`},
  ]

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

      <SettingsList.Group iconInset={false}>
        <SettingsList.ItemText>
          <Trans>{`Image CDN`}</Trans>
        </SettingsList.ItemText>
        <View style={[a.gap_md, a.w_full]}>
          <Text style={[a.leading_snug]}>
            <Trans>Override the CDN host for all images.</Trans>
          </Text>
          <Select.Root
            value={imageCdnSelectValue}
            onValueChange={value => {
              if (value === 'custom') {
                openImageCdnCustomDialog()
                return
              }
              if (value === 'default') {
                setImageCdnHost(undefined)
                return
              }
              setImageCdnHost(value)
            }}>
            <Select.Trigger label={l`Select image CDN`}>
              <Select.ValueText />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content
              label={l`Image CDN`}
              renderItem={({label, value}) => (
                <Select.Item value={value} label={label}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              )}
              items={imageCdnItems}
            />
          </Select.Root>
        </View>
      </SettingsList.Group>

      <SettingsList.Divider />

      <SettingsList.Group iconInset={false}>
        <SettingsList.ItemText>
          <Trans>{`PLC Directory`}</Trans>
        </SettingsList.ItemText>
        <View style={[a.gap_md, a.w_full]}>
          <Text style={[a.leading_snug]}>
            <Trans>The directory used to resolve did:plc accounts.</Trans>
          </Text>
          <Select.Root
            value={plcDirectorySelectValue}
            onValueChange={value => {
              if (value === 'custom') {
                openPlcDirectoryCustomDialog()
                return
              }
              if (value === PLC_DIRECTORY_PRESETS[0]) {
                setPlcDirectory(undefined)
                return
              }
              setPlcDirectory(value)
            }}>
            <Select.Trigger label={l`Select PLC directory`}>
              <Select.ValueText />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content
              label={l`PLC Directory`}
              renderItem={({label, value}) => (
                <Select.Item value={value} label={label}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              )}
              items={plcDirectoryItems}
            />
          </Select.Root>
        </View>
      </SettingsList.Group>

      <SettingsList.Divider />

      <SettingsList.Group iconInset={false}>
        <SettingsList.ItemText>
          <Trans>{`Constellation Instance`}</Trans>
        </SettingsList.ItemText>
        <View style={[a.gap_md, a.w_full]}>
          <Text style={[a.leading_snug]}>
            <Trans>
              Used for custom verifications and fixing 
              nuclear blocks via backlinks.
            </Trans>
          </Text>
          <Select.Root
            value={constellationSelectValue}
            onValueChange={value => {
              if (value === 'custom') {
                openConstellationCustomDialog()
                return
              }
              setConstellationInstance(value)
            }}>
            <Select.Trigger label={l`Select constellation instance`}>
              <Select.ValueText />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content
              label={l`Constellation Instance`}
              renderItem={({label, value}) => (
                <Select.Item value={value} label={label}>
                  <Select.ItemIndicator />
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              )}
              items={constellationItems}
            />
          </Select.Root>
        </View>
      </SettingsList.Group>

      <ConstellationInstanceDialog
        control={setConstellationInstanceControl}
        openGeneration={constellationDialogSession}
      />
      <LibreTranslateInstanceDialog
        control={setLibreTranslateInstanceControl}
      />
      <ImageCdnHostDialog
        control={setImageCdnHostControl}
        openGeneration={imageCdnDialogSession}
      />
      <PlcDirectoryDialog
        control={setPlcDirectoryControl}
        openGeneration={plcDirectoryDialogSession}
      />
    </RunesScreenLayout>
  )
}

function ConstellationInstanceDialog({
  control,
  openGeneration,
}: {
  control: Dialog.DialogControlProps
  openGeneration: number
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const constellationInstanceCustom = useConstellationInstanceCustom()
  const savedCustomUrl = constellationInstanceCustom ?? ''
  const [url, setUrl] = useState(savedCustomUrl)
  const setConstellationInstance = useSetConstellationInstance()
  const setConstellationInstanceCustom = useSetConstellationInstanceCustom()
  const {submit, isTesting, testError, canSubmit, isClear, clearTestError} =
    useInfrastructureUrlSave({
      url,
      isUrlValid: isValidHostnameUrl,
      testUrl: testConstellationUrl,
      onSave: nextUrl => {
        setConstellationInstanceCustom(nextUrl)
        setConstellationInstance(nextUrl)
      },
      onClear: () => {
        setConstellationInstanceCustom(undefined)
        setConstellationInstance(persisted.defaults.constellationInstance)
      },
      control,
    })

  useLayoutEffect(() => {
    setUrl(savedCustomUrl)
    clearTestError()
  }, [savedCustomUrl, openGeneration, clearTestError])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => {
        setUrl(savedCustomUrl)
        clearTestError()
      }}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Constellations instance URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Constellations instance URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            key={openGeneration}
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={text => {
              setUrl(text)
              clearTestError()
            }}
            placeholder={persisted.defaults.constellationInstance}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => void submit()}
            accessibilityHint={l`Input the url of the constellations instance to use`}
            defaultValue={savedCustomUrl}
          />

          {testError && <Admonition type="error">{testError}</Admonition>}

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={isClear ? l`Clear` : l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color={isClear ? 'secondary' : 'primary'}
              disabled={!canSubmit}>
              {isTesting && <ButtonIcon icon={Loader} />}
              <ButtonText>
                {isClear ? <Trans>Clear</Trans> : <Trans>Save</Trans>}
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

  const libreTranslateInstanceSetting = useLibreTranslateInstanceSetting()
  const savedCustomUrl = getLibreTranslateDialogUrl(libreTranslateInstanceSetting)
  const [url, setUrl] = useState(savedCustomUrl)
  const setLibreTranslateInstance = useSetLibreTranslateInstance()
  const {submit, isTesting, testError, canSubmit, isClear, clearTestError} =
    useInfrastructureUrlSave({
      url,
      isUrlValid: isValidHostnameUrl,
      testUrl: testLibreTranslateUrl,
      onSave: setLibreTranslateInstance,
      onClear: () => {
        setLibreTranslateInstance(undefined)
      },
      control,
    })

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => {
        setUrl(savedCustomUrl)
        clearTestError()
      }}>
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
            onChangeText={text => {
              setUrl(text)
              clearTestError()
            }}
            placeholder={LIBRETRANSLATE_DEFAULT_ORIGIN}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => void submit()}
            accessibilityHint={l`Input the url of the LibreTranslate instance to use`}
            defaultValue={savedCustomUrl}
          />

          {testError && <Admonition type="error">{testError}</Admonition>}

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={isClear ? l`Clear` : l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color={isClear ? 'secondary' : 'primary'}
              disabled={!canSubmit}>
              {isTesting && <ButtonIcon icon={Loader} />}
              <ButtonText>
                {isClear ? <Trans>Clear</Trans> : <Trans>Save</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ImageCdnHostDialog({
  control,
  openGeneration,
}: {
  control: Dialog.DialogControlProps
  openGeneration: number
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const imageCdnHostCustom = useImageCdnHostCustom()
  const savedCustomUrl = imageCdnHostCustom ?? ''
  const [url, setUrl] = useState(savedCustomUrl)
  const setImageCdnHost = useSetImageCdnHost()
  const setImageCdnHostCustom = useSetImageCdnHostCustom()
  const {submit, isTesting, testError, canSubmit, isClear, clearTestError} =
    useInfrastructureUrlSave({
      url,
      isUrlValid: isValidHostnameUrl,
      testUrl: testImageCdnUrl,
      onSave: nextUrl => {
        setImageCdnHostCustom(nextUrl)
        setImageCdnHost(nextUrl)
      },
      onClear: () => {
        setImageCdnHostCustom(undefined)
        setImageCdnHost(undefined)
      },
      control,
    })

  useLayoutEffect(() => {
    setUrl(savedCustomUrl)
    clearTestError()
  }, [savedCustomUrl, openGeneration, clearTestError])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => {
        setUrl(savedCustomUrl)
        clearTestError()
      }}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Image CDN URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Image CDN URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            key={openGeneration}
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={text => {
              setUrl(text)
              clearTestError()
            }}
            placeholder={APP_SERVER_CDN_ORIGIN}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => void submit()}
            accessibilityHint={l`Input the URL of the image CDN to use`}
            defaultValue={savedCustomUrl}
          />

          {testError && <Admonition type="error">{testError}</Admonition>}

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={isClear ? l`Clear` : l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color={isClear ? 'secondary' : 'primary'}
              disabled={!canSubmit}>
              {isTesting && <ButtonIcon icon={Loader} />}
              <ButtonText>
                {isClear ? <Trans>Clear</Trans> : <Trans>Save</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function PlcDirectoryDialog({
  control,
  openGeneration,
}: {
  control: Dialog.DialogControlProps
  openGeneration: number
}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const plcDirectoryCustom = usePlcDirectoryCustom()
  const savedCustomUrl = plcDirectoryCustom ?? ''
  const [url, setUrl] = useState(savedCustomUrl)
  const setPlcDirectory = useSetPlcDirectory()
  const setPlcDirectoryCustom = useSetPlcDirectoryCustom()
  const {submit, isTesting, testError, canSubmit, isClear, clearTestError} =
    useInfrastructureUrlSave({
      url,
      isUrlValid: isValidPlcDirectoryUrl,
      testUrl: testPlcDirectoryUrl,
      onSave: nextUrl => {
        setPlcDirectoryCustom(nextUrl)
        setPlcDirectory(nextUrl)
      },
      onClear: () => {
        setPlcDirectoryCustom(undefined)
        setPlcDirectory(undefined)
      },
      control,
    })

  useLayoutEffect(() => {
    setUrl(savedCustomUrl)
    clearTestError()
  }, [savedCustomUrl, openGeneration, clearTestError])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => {
        setUrl(savedCustomUrl)
        clearTestError()
      }}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`PLC Directory URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>PLC Directory URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            key={openGeneration}
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={text => {
              setUrl(text)
              clearTestError()
            }}
            placeholder={persisted.defaults.plcDirectory}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => void submit()}
            accessibilityHint={l`Input the URL of the PLC directory to use`}
            defaultValue={savedCustomUrl}
          />

          {testError && <Admonition type="error">{testError}</Admonition>}

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={isClear ? l`Clear` : l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color={isClear ? 'secondary' : 'primary'}
              disabled={!canSubmit}>
              {isTesting && <ButtonIcon icon={Loader} />}
              <ButtonText>
                {isClear ? <Trans>Clear</Trans> : <Trans>Save</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function useInfrastructureUrlSave({
  url,
  isUrlValid,
  testUrl,
  onSave,
  onClear,
  control,
}: {
  url: string
  isUrlValid: (url: string) => boolean
  testUrl: (url: string) => Promise<boolean>
  onSave: (normalizedUrl: string) => void
  onClear: () => void
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  const [isTesting, setIsTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const trimmedUrl = url.trim()
  const isClear = trimmedUrl === ''
  const canSubmit =
    isClear || (isUrlValid(trimmedUrl) && !isTesting)

  const clearTestError = useCallback(() => setTestError(null), [])

  const submit = async () => {
    if (isClear) {
      control.close(() => {
        onClear()
      })
      return
    }

    if (!isUrlValid(trimmedUrl)) {
      return
    }

    setIsTesting(true)
    setTestError(null)
    try {
      const normalizedUrl = normalizeInfrastructureUrl(trimmedUrl)
      const works = await testUrl(normalizedUrl)
      if (!works) {
        setTestError(
          l`Couldn't reach this server. Check the URL and try again.`,
        )
        return
      }
      control.close(() => {
        onSave(normalizedUrl)
      })
    } catch {
      setTestError(
        l`Couldn't reach this server. Check the URL and try again.`,
      )
    } finally {
      setIsTesting(false)
    }
  }

  return {
    submit,
    isTesting,
    testError,
    canSubmit,
    isClear,
    clearTestError,
  }
}

function getLibreTranslateDialogUrl(raw: string | undefined) {
  if (!raw) {
    return ''
  }

  if (normalizeOrigin(raw) === LIBRETRANSLATE_DEFAULT_ORIGIN) {
    return ''
  }

  return normalizeInfrastructureUrl(raw)
}

function normalizeOrigin(url: string | undefined) {
  try {
    return new URL(url ?? '').origin
  } catch {
    return null
  }
}

function normalizeInfrastructureUrl(url: string) {
  try {
    return new URL(url).origin
  } catch {
    return url
  }
}

function getImageCdnSelectValue(raw: string | undefined) {
  if (!raw || normalizeOrigin(raw) === APP_SERVER_CDN_ORIGIN) {
    return 'default'
  }

  const origin = normalizeOrigin(raw)
  if (
    origin &&
    IMAGE_CDN_PRESETS.includes(origin as (typeof IMAGE_CDN_PRESETS)[number])
  ) {
    return origin
  }

  return 'custom'
}

function getPlcDirectorySelectValue(raw: string | undefined) {
  const origin = normalizeOrigin(raw ?? persisted.defaults.plcDirectory)
  if (
    origin &&
    PLC_DIRECTORY_PRESETS.includes(
      origin as (typeof PLC_DIRECTORY_PRESETS)[number],
    )
  ) {
    return origin
  }

  return 'custom'
}

function getConstellationSelectValue(raw: string | undefined) {
  const origin = normalizeOrigin(
    raw ?? persisted.defaults.constellationInstance,
  )
  if (
    origin &&
    CONSTELLATION_PRESETS.includes(
      origin as (typeof CONSTELLATION_PRESETS)[number],
    )
  ) {
    return origin
  }

  return 'custom'
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

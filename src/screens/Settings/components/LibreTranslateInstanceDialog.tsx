import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {testLibreTranslateUrl} from '#/lib/infrastructure/url-test'
import {usePalette} from '#/lib/hooks/usePalette'
import {
  useLibreTranslateInstanceSetting,
  useSetLibreTranslateInstance,
} from '#/state/preferences/translation-service-preference'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {
  isValidHostnameUrl,
  normalizeInfrastructureUrl,
  normalizeOrigin,
  useInfrastructureUrlSave,
} from './infrastructureUrlSave'

const LIBRETRANSLATE_DEFAULT_ORIGIN = 'https://libretranslate.com'

export function LibreTranslateInstanceDialog({
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

function getLibreTranslateDialogUrl(raw: string | undefined) {
  if (!raw) {
    return ''
  }

  if (normalizeOrigin(raw) === LIBRETRANSLATE_DEFAULT_ORIGIN) {
    return ''
  }

  return normalizeInfrastructureUrl(raw)
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

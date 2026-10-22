import {View} from 'react-native'

import {getShapeStyle} from '#/lib/shapes'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {Logomark} from '#/view/icons/Logomark'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'

// WHAT DID I DO TO DESERVE A LIFE OF ATPROTO & REACT NATIVE DEVELOPENT
// WHEN I WAKE UP AND REALIZE.. aSB3YW50IHRvIGJlIGtyaXMgZGVsdGFydW5lIGluc3RlYWQK
// yet.. it's not possible.

const ANDROID_OBTAINIUM_DOWNLOAD_LINK =
  'https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22app.tennaparty%22%2C%22url%22%3A%22https%3A%2F%2Fdepot.tenna.party%2Fapp-release.apk%22%2C%22author%22%3A%22Kris%22%2C%22name%22%3A%22tenna.party%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22requestHeader%5C%22%3A%5B%7B%5C%22requestHeader%5C%22%3A%5C%22User-Agent%3A%20obt%5C%22%7D%5D%2C%5C%22defaultPseudoVersioningMethod%5C%22%3A%5C%22partialAPKHash%5C%22%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22appName%5C%22%3A%5C%22tenna.party%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D'

export function ForkDisclosure() {
  const t = useTheme()
  const enableSquareButtons = useEnableSquareButtons()

  const {linkWarningDialogControl} = useGlobalDialogsControlContext()
  const {nux, status} = useNux(Nux.TennaPartyForkDisclosure_Native)
  const {mutate: saveNux, isPending} = useSaveNux()

  if (status !== 'ready' || nux?.completed || isPending) return null

  return (
    <View style={[a.p_lg]}>
      <View style={[a.flex_row, a.gap_sm, a.mb_sm]}>
        <Logomark width={24} />
        <Text style={[a.text_2xl]}>Welcome! I'll make this quick.</Text>
      </View>
      <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
        Made by @kris.kralsei.stream. Fork of Witchsky.{' '}
        {IS_WEB && <>Android app avaiable.</>}
        {IS_NATIVE && <>Web version avaiable on https://tenna.party</>}
      </Text>
      <View style={[a.flex_row, a.mt_sm, a.gap_sm]}>
        <Button
          label="Close & don't show again"
          color="primary"
          size="tiny"
          onPress={() => {
            saveNux({
              id: Nux.TennaPartyForkDisclosure_Native,
              completed: true,
              data: undefined,
            })
          }}
          shape={enableSquareButtons ? 'square' : 'default'}
          style={
            enableSquareButtons
              ? [
                  getShapeStyle(
                    enableSquareButtons,
                    a.rounded_sm,
                    a.rounded_full,
                  ),
                ]
              : [a.rounded_full]
          }>
          <ButtonText>Close</ButtonText>
        </Button>
        {IS_WEB && (
          <>
            <Button
              label="Download the tenna.party Android app from Obtainium"
              color="secondary"
              size="tiny"
              shape={enableSquareButtons ? 'square' : 'default'}
              style={
                enableSquareButtons
                  ? [
                      getShapeStyle(
                        enableSquareButtons,
                        a.rounded_sm,
                        a.rounded_full,
                      ),
                    ]
                  : [a.rounded_full]
              }
              onPress={() => {
                linkWarningDialogControl.open({
                  href: ANDROID_OBTAINIUM_DOWNLOAD_LINK,
                  displayText: '',
                  share: true,
                })
              }}>
              <ButtonText>Download for Android</ButtonText>
            </Button>
          </>
        )}
      </View>
    </View>
  )
}

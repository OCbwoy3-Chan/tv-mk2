import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {IS_E2E} from '#/env'

export function enabled() {
  return !IS_E2E
}

export function WitchskyUpdateAnnouncement() {
  const t = useTheme()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {dismissActiveNux} = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  function readUpdate() {
    control.close(() => {
      navigation.navigate('PostThread', {
        name: 'did:plc:nstiflhvn4dywu5xlwq5wp4v',
        rkey: '3mwns2l253c2u',
      })
    })
  }

  return (
    <Dialog.Outer
      control={control}
      onClose={dismissActiveNux}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`What’s new in Witchsky`}
        style={[web({maxWidth: 440})]}>
        <View
          testID="witchskyUpdateAnnouncement"
          style={[a.align_center, a.gap_xl, a.py_lg]}>
          <View style={[a.p_lg, a.rounded_full, t.atoms.bg_contrast_25]}>
            <SparkleIcon size="xl" fill={t.palette.primary_500} />
          </View>
          <View style={[a.gap_md]}>
            <Text style={[a.text_3xl, a.font_bold, a.text_center]}>
              <Trans>What’s new in Witchsky</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug, a.text_center]}>
              <Trans>
                Explore new themes, keyboard shortcuts, video controls, and
                buttons in the latest Witchsky update!
              </Trans>
            </Text>
          </View>
          <View style={[a.w_full, a.gap_sm]}>
            <Button
              testID="witchskyUpdateReadMore"
              label={l`See the new features`}
              size="large"
              color="primary"
              onPress={readUpdate}>
              <ButtonText>
                <Trans>See the new features</Trans>
              </ButtonText>
            </Button>
            <Button
              testID="witchskyUpdateDismiss"
              label={l`Got it`}
              size="large"
              color="secondary"
              onPress={() => control.close()}>
              <ButtonText>
                <Trans>Got it</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

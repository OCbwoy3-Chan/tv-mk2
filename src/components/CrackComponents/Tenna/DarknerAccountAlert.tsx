import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {navigate} from '#/Navigation'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {DarknerIcon} from '../Icons'

export function DarknerAccountAlert({
  control,
  profile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  const isSelf = profile.did === currentAccount?.did
  const description = isSelf
    ? l`You have marked yourself as a Darkner. You can remove this label at any time from Tenna's Settings.`
    : l`This user is a Darkner.`

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.ScrollableInner label={l`Darkner`} style={[web({maxWidth: 320})]}>
        <View style={[a.align_center, a.pb_md, a.shadow_sm]}>
          <DarknerIcon width={48} fill={t.atoms.text_contrast_medium.color} />
        </View>
        <View style={[a.align_center]}>
          <Text
            style={[
              a.leading_snug,
              a.text_center,
              a.pb_xl,
              a.text_md,
              t.atoms.text_contrast_high,
              {maxWidth: 300},
            ]}>
            {description}
          </Text>
        </View>
        <View style={[a.w_full, a.gap_sm]}>
          <Button
            label={l`Okay`}
            onPress={() => control.close()}
            color="primary"
            size="large">
            <ButtonText>
              <Trans>Okay</Trans>
            </ButtonText>
          </Button>
          {isSelf ? (
            <Button
              label={l`Open settings`}
              onPress={() => {
                control.close(() => {
                  navigate('TennaBadgesSettings')
                })
              }}
              color="secondary"
              size="large">
              <ButtonText>
                <Trans>Open settings</Trans>
              </ButtonText>
            </Button>
          ) : null}
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

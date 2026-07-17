import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {SpecialBadge} from './SpecialBadge'

const TEXTS_FOR_ACCOUNT = {
  'did:plc:vshnclkqqguyg6xcz6q7g65k': 'Toby',

  // https://tenna.party/profile/did:plc:7hs24amavcdm4ufoqgonbm75/lists/3mpjcxrxnjp2v we are kris deltarune
  'did:plc:s27ozzhlwk5jgkpk4adxmy2i': 'Kris Deltarune Fictionkin',
  'did:web:vessel.darkworld.download': 'Kris Deltarune Fictionkin',
  'did:plc:tywla754gbcxasm4rplh5jvb': 'Kris Deltarune Fictionkin'
  
}

export function SpecialAccountAlert({
  control,
  profile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const description = (TEXTS_FOR_ACCOUNT as Record<string, string>)[profile.did]

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.ScrollableInner label={l`Toby`} style={[web({maxWidth: 320})]}>
        <View style={[a.align_center, a.pb_md, a.shadow_sm]}>
          <SpecialBadge profile={profile} width={48} />
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
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

import { View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'

import { STALE } from '#/state/queries'
import { useProfileQuery } from '#/state/queries/profile'
import { atoms as a, useTheme, web } from '#/alf'
import { Button, ButtonText } from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import { Text } from '#/components/Typography'
import { useDeltasPreferences } from '#/deltas/preferences'
import { type AnyProfileView } from '#/types/bsky/profile'
import { shouldShowMdniBadge } from './mdniChecker'
import { Image } from 'expo-image'

export function useHasMdniBadge(profile: AnyProfileView) {
  const { showMdniBadge } = useDeltasPreferences()
  const hasDescription = 'description' in profile
  const { data: fullProfile } = useProfileQuery({
    did: showMdniBadge && !hasDescription ? profile.did : undefined,
    staleTime: STALE.MINUTES.FIFTEEN,
  })
  const description = hasDescription
    ? profile.description
    : fullProfile?.description

  return showMdniBadge && shouldShowMdniBadge({ ...profile, description })
}

export function MdniBadge({ width }: { width: number }) {
  const { t: l } = useLingui()
  const t = useTheme();
  const control = Dialog.useDialogControl()
  return (
    <>
      <Text
        emoji
        accessibilityRole="button"
        accessibilityLabel={l`Minors do not interact`}
        accessibilityHint={l`Show information about this badge`}
        allowFontScaling={false}
        style={[a.leading_tight, { fontSize: width }]}
        onPress={evt => {
          evt.preventDefault()
          control.open()
        }}>
        🔞
      </Text>
      <Dialog.Outer control={control} nativeOptions={{ preventExpansion: true }}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={l`Minors do not interact`}
          style={[web({ maxWidth: 320 })]}>
          <View style={[a.align_center, a.pb_md]}>
            <Image
              source={require('#/../assets/badges/telemoji-1f51e.webp')}
              accessible={false}
              accessibilityIgnoresInvertColors
              contentFit="contain"
              style={{ width: 128, height: 128 }}
            />
          </View>
          <Text style={[a.text_center, a.text_md, a.pb_sm]}>
            <Trans>
              MDNI Account
            </Trans>
          </Text>
          <Text style={[a.text_center, a.text_md, t.atoms.text_contrast_medium, a.pb_xl]}>
            <Trans>
              Do not interact if you're under 18.
            </Trans>
          </Text>
          <Button
            label={l`Okay`}
            onPress={() => control.close()}
            color="primary"
            size="large">
            <ButtonText>
              <Trans>Okay</Trans>
            </ButtonText>
          </Button>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

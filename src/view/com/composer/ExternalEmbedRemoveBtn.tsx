import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

export function ExternalEmbedRemoveBtn({
  onRemove,
  style,
}: {onRemove: () => void} & ViewStyleProp) {
  const t = useTheme()
  const {t: l} = useLingui()

  const enableSquareButtons = useEnableSquareButtons()

  return (
    <View style={[a.absolute, {top: 8, right: 8}, a.z_50, style]}>
      <Button
        label={l`Remove attachment`}
        onPress={onRemove}
        size="small"
        variant="solid"
        color="secondary"
        shape={enableSquareButtons ? 'square' : 'round'}
        style={[t.atoms.shadow_sm]}>
        <ButtonIcon icon={X} size="sm" />
      </Button>
    </View>
  )
}

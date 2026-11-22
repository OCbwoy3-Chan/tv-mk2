import {useCallback} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Poll_Stroke2_Corner0_Rounded as PollIcon} from '#/components/icons/Poll'
import {useAnalytics} from '#/analytics'

type Props = {
  onPress: () => void
  disabled?: boolean
}

export function SelectPollBtn({onPress, disabled}: Props) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()

  const onPressAddPoll = useCallback(() => {
    ax.metric('composer:poll:open', {})
    onPress()
  }, [ax, onPress])

  return (
    <View style={[a.relative]}>
      <Button
        testID="openPollBtn"
        onPress={onPressAddPoll}
        label={l({
          message: 'Add poll',
          comment:
            'Accessibility label for the button in the post composer that attaches a poll to the post.',
        })}
        accessibilityHint={l({
          message: 'Attaches a poll to this post',
          comment:
            'Accessibility hint announced after the poll button label, describing what activating it will do.',
        })}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled}>
        <PollIcon size="lg" style={disabled && t.atoms.text_contrast_low} />
      </Button>
    </View>
  )
}

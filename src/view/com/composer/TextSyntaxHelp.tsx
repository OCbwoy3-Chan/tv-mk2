import {useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {Button, ButtonIcon} from '#/components/Button'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import * as Tooltip from '#/components/Tooltip'

export function TextSyntaxHelp() {
  const {t: l} = useLingui()
  const [visible, setVisible] = useState(false)
  const label = l`Text formatting help`
  const slash = String.fromCharCode(92)
  const help = [
    l`${slash} keeps links and handles plain.`,
    l`<...> sets a facet’s boundary.`,
    l`[label](url) makes a masked link.`,
  ].join('\n')

  return (
    <Tooltip.Outer
      visible={visible}
      onVisibleChange={setVisible}
      position="bottom">
      <Tooltip.Target>
        <Button
          label={label}
          accessibilityHint={l`Shows link and text formatting options`}
          testID="composerTextSyntaxHelp"
          size="small"
          color="secondary"
          variant="ghost"
          shape="round"
          style={{width: 36, height: 36, backgroundColor: 'transparent'}}
          hoverStyle={{backgroundColor: 'transparent', opacity: 0.5}}
          onPress={() => setVisible(value => !value)}>
          <ButtonIcon icon={CircleQuestionIcon} size="md" />
        </Button>
      </Tooltip.Target>
      <Tooltip.BubbleText label={label}>{help}</Tooltip.BubbleText>
    </Tooltip.Outer>
  )
}

import {View} from 'react-native'

import {type DragAreaProps} from '#/screens/Profile/Header/WitchHatEditor/DragArea/types'
import {useHatDrag} from '#/screens/Profile/Header/WitchHatEditor/useHatDrag'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'

export function DragArea({
  placement,
  previewSize,
  disabled,
  onChange,
}: DragAreaProps) {
  const {setDisableDrag} = Dialog.useDialogContext()
  const panHandlers = useHatDrag({
    placement,
    previewSize,
    disabled,
    setPlacement: onChange,
    setDisableDrag,
  })
  return (
    <View
      {...panHandlers}
      accessible={false}
      testID="witchHatDragArea"
      style={[a.absolute, a.inset_0]}
    />
  )
}

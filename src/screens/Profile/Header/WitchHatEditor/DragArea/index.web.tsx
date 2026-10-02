import {type DragAreaProps} from '#/screens/Profile/Header/WitchHatEditor/DragArea/types'
import {useHatPointerDrag} from '#/screens/Profile/Header/WitchHatEditor/DragArea/useHatPointerDrag'

export function DragArea(props: DragAreaProps) {
  const handlers = useHatPointerDrag(props)
  return (
    <div
      {...handlers}
      data-testid="witchHatDragArea"
      style={{
        position: 'absolute',
        inset: 0,
        touchAction: 'none',
        cursor: 'move',
      }}
    />
  )
}

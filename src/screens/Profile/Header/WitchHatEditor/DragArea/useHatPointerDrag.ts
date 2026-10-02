import {useRef} from 'react'

import {type DragAreaProps} from '#/screens/Profile/Header/WitchHatEditor/DragArea/types'
import {
  type HatPlacement,
  moveHat,
} from '#/screens/Profile/Header/WitchHatEditor/utils'

export function useHatPointerDrag({
  placement,
  previewSize,
  disabled,
  onChange,
}: DragAreaProps) {
  const drag = useRef<{
    pointerId: number
    clientX: number
    clientY: number
    placement: HatPlacement
    previewSize: number
  } | null>(null)

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (
      disabled ||
      !previewSize ||
      !event.isPrimary ||
      event.button !== 0 ||
      drag.current
    )
      return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      placement,
      previewSize,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || disabled || event.pointerId !== start.pointerId) return
    const next = moveHat(
      start.placement,
      event.clientX - start.clientX,
      event.clientY - start.clientY,
      start.previewSize,
    )
    /* A position drag must not overwrite size or rotation from another control. */
    onChange(current => ({...current, x: next.x, y: next.y}))
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  /* Pointer capture is local to this surface and ends even when a dialog stops touchend. */
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
  }
}

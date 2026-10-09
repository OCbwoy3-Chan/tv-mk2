import {useEffect, useMemo, useRef} from 'react'
import {PanResponder} from 'react-native'

import {
  type HatPlacement,
  moveHat,
} from '#/screens/Profile/Header/WitchHatEditor/utils'

export function useHatDrag({
  placement,
  previewSize,
  disabled,
  setPlacement,
  setDisableDrag,
}: {
  placement: HatPlacement
  previewSize: number
  disabled: boolean
  setPlacement: (placement: HatPlacement) => void
  setDisableDrag: (disabled: boolean) => void
}) {
  const latestPlacement = useRef(placement)
  const dragStart = useRef(placement)
  useEffect(() => {
    latestPlacement.current = placement
  }, [placement])
  useEffect(() => () => setDisableDrag(false), [setDisableDrag])

  /** PanResponder must keep its gesture state across position updates. */
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          dragStart.current = latestPlacement.current
          setDisableDrag(true)
        },
        onPanResponderMove: (_event, gesture) => {
          setPlacement(
            moveHat(dragStart.current, gesture.dx, gesture.dy, previewSize),
          )
        },
        onPanResponderRelease: () => setDisableDrag(false),
        onPanResponderTerminate: () => setDisableDrag(false),
        onPanResponderTerminationRequest: () => false,
      }),
    [disabled, previewSize, setPlacement, setDisableDrag],
  )
  return responder.panHandlers
}

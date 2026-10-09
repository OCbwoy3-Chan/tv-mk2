import {useState} from 'react'
import {
  type GestureResponderEvent,
  PanResponder,
  type PanResponderGestureState,
} from 'react-native'
import {act, renderHook} from '@testing-library/react-native'

import {useHatDrag} from '#/screens/Profile/Header/WitchHatEditor/useHatDrag'
import {INITIAL_HAT_PLACEMENT} from '#/screens/Profile/Header/WitchHatEditor/utils'

it('keeps the same responder during a continuous drag and starts the next drag at the latest position', () => {
  const create = jest.spyOn(PanResponder, 'create')
  const setDisableDrag = jest.fn()
  const {result, unmount} = renderHook(() => {
    const [placement, setPlacement] = useState(INITIAL_HAT_PLACEMENT)
    const handlers = useHatDrag({
      placement,
      previewSize: 320,
      disabled: false,
      setPlacement,
      setDisableDrag,
    })
    return {placement, handlers}
  })
  const config = create.mock.calls[0][0]
  const event = {} as GestureResponderEvent
  const gesture = {dx: 0, dy: 0} as PanResponderGestureState
  act(() => {
    config.onPanResponderGrant?.(event, gesture)
  })
  act(() => {
    config.onPanResponderMove?.(event, {...gesture, dx: 32, dy: 16})
  })
  expect(result.current.placement.x).toBeCloseTo(0.6)
  expect(result.current.placement.y).toBeCloseTo(0.43)
  act(() => {
    config.onPanResponderMove?.(event, {...gesture, dx: 64, dy: 32})
  })
  expect(result.current.placement.x).toBeCloseTo(0.7)
  expect(result.current.placement.y).toBeCloseTo(0.48)
  expect(create).toHaveBeenCalledTimes(1)
  expect(setDisableDrag).toHaveBeenCalledWith(true)
  act(() => {
    config.onPanResponderRelease?.(event, gesture)
  })
  expect(setDisableDrag).toHaveBeenLastCalledWith(false)
  act(() => {
    config.onPanResponderGrant?.(event, gesture)
  })
  act(() => {
    config.onPanResponderMove?.(event, {...gesture, dx: 32, dy: 0})
  })
  expect(result.current.placement.x).toBeCloseTo(0.8)
  expect(result.current.placement.y).toBeCloseTo(0.48)
  unmount()
  expect(setDisableDrag).toHaveBeenLastCalledWith(false)
  create.mockRestore()
})

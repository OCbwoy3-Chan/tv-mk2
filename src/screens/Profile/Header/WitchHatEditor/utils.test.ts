import {
  INITIAL_HAT_PLACEMENT,
  isOctober,
  moveHat,
} from '#/screens/Profile/Header/WitchHatEditor/utils'

it('is available throughout October in local time, including future years', () => {
  expect(isOctober(new Date(2026, 8, 30, 23, 59, 59))).toBe(false)
  expect(isOctober(new Date(2026, 9, 1))).toBe(true)
  expect(isOctober(new Date(2026, 9, 31, 23, 59, 59))).toBe(true)
  expect(isOctober(new Date(2026, 10, 1))).toBe(false)
  expect(isOctober(new Date(2027, 9, 1))).toBe(true)
})

it('starts centered horizontally and slightly above center', () => {
  expect(INITIAL_HAT_PLACEMENT.x).toBe(0.5)
  expect(INITIAL_HAT_PLACEMENT.y).toBeLessThan(0.5)
})

it('preserves the grab offset and scales dragging with the preview', () => {
  const start = {x: 0.4, y: 0.3, size: 0.5, rotation: 0}
  expect(moveHat(start, 32, -16, 320)).toEqual({
    x: 0.5,
    y: 0.25,
    size: 0.5,
    rotation: 0,
  })
  expect(moveHat(start, 16, -8, 160)).toEqual({
    x: 0.5,
    y: 0.25,
    size: 0.5,
    rotation: 0,
  })
})

it('keeps the hat center on the avatar and tolerates an unmeasured preview', () => {
  expect(moveHat(INITIAL_HAT_PLACEMENT, -1000, 1000, 320)).toEqual({
    x: 0,
    y: 1,
    size: 0.5,
    rotation: 0,
  })
  expect(moveHat(INITIAL_HAT_PLACEMENT, 10, 10, 0)).toEqual(
    INITIAL_HAT_PLACEMENT,
  )
})

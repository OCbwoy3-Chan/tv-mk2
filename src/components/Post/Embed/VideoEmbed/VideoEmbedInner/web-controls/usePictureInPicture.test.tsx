/** @jest-environment jsdom */

import {act} from 'react'
import {createRoot} from 'react-dom/client'

import {usePictureInPicture} from './usePictureInPicture'

it('tracks entering, switching, and closing browser picture-in-picture', () => {
  const container = document.createElement('div')
  const first = document.createElement('video')
  const second = document.createElement('video')
  document.body.append(container, first, second)
  const root = createRoot(container)
  let current: Element | null = null
  let observed: Element | null = null
  Object.defineProperty(document, 'pictureInPictureElement', {
    configurable: true,
    get: () => current,
  })
  function Observer() {
    observed = usePictureInPicture()
    return null
  }
  try {
    act(() => root.render(<Observer />))
    expect(observed).toBeNull()
    act(() => {
      current = first
      first.dispatchEvent(new Event('enterpictureinpicture'))
    })
    expect(observed).toBe(first)
    act(() => {
      current = second
      first.dispatchEvent(new Event('leavepictureinpicture'))
      second.dispatchEvent(new Event('enterpictureinpicture'))
    })
    expect(observed).toBe(second)
    act(() => {
      current = null
      second.dispatchEvent(new Event('leavepictureinpicture'))
    })
    expect(observed).toBeNull()
  } finally {
    act(() => root.unmount())
    container.remove()
    first.remove()
    second.remove()
    Reflect.deleteProperty(document, 'pictureInPictureElement')
  }
})

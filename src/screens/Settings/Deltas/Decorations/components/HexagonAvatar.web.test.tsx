/** @jest-environment jsdom */

import {act} from 'react'
import {createRoot} from 'react-dom/client'

import {HexagonAvatar} from './HexagonAvatar'

jest.mock('react-native', () => jest.requireActual('react-native-web'))

function renderInto(node: React.ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    createRoot(container).render(node)
  })
  return container
}

/*
 * A shared clip id breaks rendering: browsers resolve `url(#id)` to the first
 * matching element, and an inactive screen or a virtualized-off row can put
 * that match inside a `display: none` subtree, leaving the image unclipped.
 */
it('gives every mounted avatar its own clip id', () => {
  const container = renderInto(
    <>
      <div style={{display: 'none'}}>
        <HexagonAvatar uri="hidden.png" size={80} rounded stroke="#FFD700" />
      </div>
      <HexagonAvatar uri="visible.png" size={80} rounded stroke="#FFD700" />
    </>,
  )

  const svgs = Array.from(container.querySelectorAll('svg'))
  expect(svgs).toHaveLength(2)

  const ids = svgs.map(svg => svg.querySelector('clipPath')?.id)
  expect(ids[0]).toBeTruthy()
  expect(ids[1]).toBeTruthy()
  expect(ids[0]).not.toBe(ids[1])

  for (const svg of svgs) {
    const clipId = svg.querySelector('clipPath')?.id
    expect(svg.querySelector('image')?.getAttribute('clip-path')).toBe(
      `url(#${clipId})`,
    )
  }
})

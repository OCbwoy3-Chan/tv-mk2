import {render} from '@testing-library/react-native'

import {GradientName} from './GradientName'
import {OutlinedName} from './OutlinedName'

jest.mock('#/platform/ui-text-view', () => ({
  UITextView:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/alf/typography', () => ({
  renderChildrenWithEmoji: (children: string) => children,
}))
jest.mock('#/env', () => ({IS_ANDROID: true, IS_WEB: false}))
jest.mock('./useDecorations', () => ({
  useNameGradient: () => ({colors: ['#ff0000', '#0000ff']}),
  useNameStyle: () => ({textShadowColor: '#050408', textShadowRadius: 2}),
}))

it('outlines words without boxing spaces or emoji, and respects disabling the outline', () => {
  const name = 'Chungus Studios 🇨🇦🏳️‍🌈'
  const result = render(<GradientName>{name}</GradientName>)
  expect(
    result.UNSAFE_getAllByType(OutlinedName).map(node => node.props.text),
  ).toEqual(['Chungus', 'Studios'])

  result.rerender(
    <GradientName outline={false}>{name}</GradientName>,
  )
  expect(result.UNSAFE_queryAllByType(OutlinedName)).toHaveLength(0)
  result.rerender(<GradientName enabled={false}>{name}</GradientName>)
  expect(result.getByText(name)).toBeTruthy()
})

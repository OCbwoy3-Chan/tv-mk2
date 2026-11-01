import {Text, View} from 'react-native'
import {fireEvent, render} from '@testing-library/react-native'

import {NameTextContext} from './nameTextContext'
import {OutlinedName} from './OutlinedName'

it('measures the inherited font and exposes only the foreground to accessibility', () => {
  const result = render(
    <NameTextContext.Provider value={{fontSize: 24, lineHeight: 30}}>
      <OutlinedName text="Studios">
        <Text>Studios</Text>
      </OutlinedName>
    </NameTextContext.Provider>,
  )
  expect(result.getAllByText('Studios')).toHaveLength(1)
  const measurement = result.UNSAFE_getAllByType(Text).find(
    node => node.props.onTextLayout,
  )!
  expect(measurement.props.allowFontScaling).toBe(false)
  fireEvent(measurement, 'textLayout', {
    nativeEvent: {lines: [{width: 82.4, height: 30, descender: 6}]},
  })
  expect(result.UNSAFE_getByType(View).props.style).toMatchObject({
    width: 83,
    height: 30,
    transform: [{translateY: 6}],
  })
})

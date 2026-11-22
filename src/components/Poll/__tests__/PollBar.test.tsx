import {render} from '@testing-library/react-native'

import {PollBar} from '../PollBar'

jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native')
  return {Text}
})
jest.mock('#/components/icons/CircleCheck', () => {
  const {View} = require('react-native')
  return {
    CircleCheck_Stroke2_Corner0_Rounded: ({testID}: {testID?: string}) => (
      <View testID={testID} />
    ),
  }
})

it('marks a winning choice', () => {
  const {getByTestId} = render(
    <PollBar label="Yes" pct={60} mine={false} winner />,
  )
  expect(getByTestId('pollWinnerMark')).toBeTruthy()
})

it('leaves other choices unmarked', () => {
  const {queryByTestId} = render(<PollBar label="No" pct={40} mine />)
  expect(queryByTestId('pollWinnerMark')).toBeNull()
})

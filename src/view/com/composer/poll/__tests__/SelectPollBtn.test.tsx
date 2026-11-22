import {fireEvent, render} from '@testing-library/react-native'

jest.mock('@lingui/react', () => {
  const format = (
    message:
      {message?: string; values?: Record<string, string | number>} | string,
  ) => {
    if (typeof message === 'string') return message
    return (message.message ?? '').replace(/{(\w+)}/g, (_, key: string) =>
      String(message.values?.[key] ?? ''),
    )
  }
  return {
    useLingui: () => ({_: format}),
    Trans: ({
      id,
      message,
      values,
    }: {
      id: string
      message?: string
      values?: Record<string, string | number>
    }) => format({message: message ?? id, values}),
  }
})
jest.mock('#/alf', () => {
  const blank = new Proxy({}, {get: () => ({})})
  return {
    atoms: blank,
    useTheme: () => ({
      atoms: blank,
      palette: new Proxy({}, {get: () => '#000'}),
    }),
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native')
  return {Text}
})
jest.mock('#/components/icons/Poll', () => ({
  Poll_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} = require('react-native')
  return {
    Button: ({
      accessibilityHint,
      children,
      disabled,
      label,
      onPress,
      testID,
    }: {
      accessibilityHint: string
      children: React.ReactNode
      disabled?: boolean
      label: string
      onPress: () => void
      testID?: string
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{disabled: !!disabled}}
        disabled={disabled}
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
  }
})

const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

import {SelectPollBtn} from '../SelectPollBtn'

describe('SelectPollBtn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens the poll editor and reports it', () => {
    const onPress = jest.fn()
    const {getByTestId} = render(<SelectPollBtn onPress={onPress} />)

    const button = getByTestId('openPollBtn')
    expect(button).toHaveProp('accessibilityLabel', 'Add poll')
    expect(button).toHaveProp(
      'accessibilityHint',
      'Attaches a poll to this post',
    )
    fireEvent.press(button)

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(mockMetric).toHaveBeenCalledTimes(1)
    expect(mockMetric).toHaveBeenCalledWith('composer:poll:open', {})
  })

  it('shows no New badge', () => {
    const {queryByText} = render(<SelectPollBtn onPress={jest.fn()} />)
    expect(queryByText('New')).toBeNull()
  })

  it('blocks the press while disabled', () => {
    const onPress = jest.fn()
    const {getByTestId} = render(<SelectPollBtn onPress={onPress} disabled />)

    const button = getByTestId('openPollBtn')
    expect(button).toHaveProp('accessibilityState', {disabled: true})
    fireEvent.press(button)

    expect(onPress).not.toHaveBeenCalled()
    expect(mockMetric).not.toHaveBeenCalled()
  })

  it('is enabled by default', () => {
    const {getByTestId} = render(<SelectPollBtn onPress={jest.fn()} />)
    expect(getByTestId('openPollBtn')).toHaveProp('accessibilityState', {
      disabled: false,
    })
  })
})

import {fireEvent, render} from '@testing-library/react-native'

jest.mock('@lingui/react', () => {
  const format = (
    message: {message?: string; values?: Record<string, string>} | string,
  ) => (typeof message === 'string' ? message : (message.message ?? ''))
  return {useLingui: () => ({_: format, t: format})}
})
jest.mock('#/components/Button', () => {
  const {Pressable, Text} = require('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
      testID,
    }: {
      children: React.ReactNode
      label: string
      onPress: () => void
      testID?: string
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ButtonText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/icons/Trash', () => ({
  Trash_Stroke2_Corner0_Rounded: () => null,
}))
const mockPromptOpen = jest.fn()
jest.mock('#/components/Prompt', () => {
  const {Pressable, Text} = require('react-native')
  return {
    usePromptControl: () => ({open: mockPromptOpen}),
    Basic: ({title, onConfirm}: {title: string; onConfirm: () => void}) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint=""
        testID="confirmDelete"
        onPress={onConfirm}>
        <Text>{title}</Text>
      </Pressable>
    ),
  }
})
const mockToast = jest.fn()
jest.mock('#/components/Toast', () => ({
  show: (...args: unknown[]) => mockToast(...args),
}))
const mockLoggerError = jest.fn()
jest.mock('#/logger', () => ({
  logger: {error: (...args: unknown[]) => mockLoggerError(...args)},
}))
jest.mock('#/lib/network-error', () => ({
  isNetworkError: (e: Error) => e.message === 'offline',
}))
const mockGoBack = jest.fn()
const mockNavigate = jest.fn()
let mockCanGoBack = true
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    canGoBack: () => mockCanGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}))
const mockSetQueryData = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({setQueryData: mockSetQueryData}),
}))
type MutateOptions = {onSuccess?: () => void; onError?: (e: Error) => void}
const mockMutate = jest.fn<void, [string, MutateOptions]>()
jest.mock('#/features/events/queries', () => ({
  eventQueryKey: (uri: string) => ['event', uri],
  useDeleteEventMutation: () => ({mutate: mockMutate, isPending: false}),
}))

import {type EventView} from '#/features/events/types'
import {DeleteEventButton} from '../DeleteEventButton'

const EVENT = {
  uri: 'at://did:plc:alice/community.lexicon.calendar.event/3kevent',
  creator: {did: 'did:plc:alice', handle: 'alice.test'},
} as unknown as EventView

function renderButton() {
  const onDeleted = jest.fn()
  const utils = render(
    <DeleteEventButton event={EVENT} onDeleted={onDeleted} />,
  )
  return {onDeleted, ...utils}
}

describe('DeleteEventButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanGoBack = true
  })

  it('asks before deleting', () => {
    const {getByTestId} = renderButton()
    fireEvent.press(getByTestId('deleteEventBtn'))
    expect(mockPromptOpen).toHaveBeenCalledTimes(1)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('deletes on confirm, then drops the event and leaves the page', () => {
    mockMutate.mockImplementation((_uri, options) => options.onSuccess?.())
    const {getByTestId, onDeleted} = renderButton()

    fireEvent.press(getByTestId('confirmDelete'))

    expect(mockMutate).toHaveBeenCalledWith(EVENT.uri, expect.anything())
    expect(onDeleted).toHaveBeenCalledTimes(1)
    expect(mockSetQueryData).toHaveBeenCalledWith(['event', EVENT.uri], null)
    expect(mockToast).toHaveBeenCalledWith('Event deleted')
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('goes home when there is nowhere to go back to', () => {
    mockCanGoBack = false
    mockMutate.mockImplementation((_uri, options) => options.onSuccess?.())
    const {getByTestId} = renderButton()

    fireEvent.press(getByTestId('confirmDelete'))

    expect(mockGoBack).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('Home')
  })

  it('reports a failure and stays on the page', () => {
    mockMutate.mockImplementation((_uri, options) =>
      options.onError?.(new Error('boom')),
    )
    const {getByTestId, onDeleted} = renderButton()

    fireEvent.press(getByTestId('confirmDelete'))

    expect(onDeleted).not.toHaveBeenCalled()
    expect(mockGoBack).not.toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith("Couldn't delete the event", {
      type: 'error',
    })
  })

  it('does not log a network failure', () => {
    mockMutate.mockImplementation((_uri, options) =>
      options.onError?.(new Error('offline')),
    )
    const {getByTestId} = renderButton()

    fireEvent.press(getByTestId('confirmDelete'))

    expect(mockLoggerError).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith("Couldn't delete the event", {
      type: 'error',
    })
  })
})

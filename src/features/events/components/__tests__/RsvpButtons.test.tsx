import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render as rtlRender} from '@testing-library/react-native'

const mockMutate = jest.fn<void, [{status: string}, unknown]>()
jest.mock('../../queries', () => ({
  useRsvpMutation: () => ({mutate: mockMutate, isPending: false}),
}))
jest.mock('#/state/session', () => ({
  useRequireAuth: () => (fn: () => void) => fn(),
}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
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
      onPress?: () => void
      testID?: string
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        testID={testID}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ButtonText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
    ButtonIcon: () => null,
  }
})
import {
  type EventView,
  RSVP_GOING,
  RSVP_INTERESTED,
  RSVP_NOTGOING,
} from '../../types'
import {RsvpButtons} from '../RsvpButtons'

function eventWith(status?: string) {
  return {
    uri: 'at://did:plc:a/community.lexicon.calendar.event/1',
    viewer: status ? {rsvp: {uri: 'at://rsvp', status}} : {},
  } as unknown as EventView
}

i18n.loadAndActivate({locale: 'en', messages: {}})

function render(ui: React.ReactElement) {
  return rtlRender(<I18nProvider i18n={i18n}>{ui}</I18nProvider>)
}

beforeEach(() => mockMutate.mockClear())

it('offers only Going and Interested', () => {
  const {getByTestId, queryByTestId} = render(
    <RsvpButtons event={eventWith()} />,
  )
  expect(getByTestId('rsvp-going')).toBeTruthy()
  expect(getByTestId('rsvp-interested')).toBeTruthy()
  expect(queryByTestId('rsvp-notgoing')).toBeNull()
  expect(queryByTestId('rsvpMoreBtn')).toBeNull()
})

it('RSVPs from the buttons', () => {
  const {getByTestId} = render(<RsvpButtons event={eventWith()} />)
  fireEvent.press(getByTestId('rsvp-interested'))
  expect(mockMutate.mock.calls[0][0]).toMatchObject({status: RSVP_INTERESTED})
})

it('lets an old Not going answer switch to Going', () => {
  const {getByTestId} = render(<RsvpButtons event={eventWith(RSVP_NOTGOING)} />)
  expect(getByTestId('rsvp-going').props.accessibilityLabel).toBe('Going')
  fireEvent.press(getByTestId('rsvp-going'))
  expect(mockMutate.mock.calls[0][0]).toMatchObject({status: RSVP_GOING})
})

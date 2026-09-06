import {Pressable, Text} from 'react-native'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'

import {type SessionAccount} from '../types'

const mockLogin = jest.fn()
const mockShow = jest.fn()
const mockRetry = jest.fn()
jest.mock('#/state/session', () => ({
  useSessionApi: () => ({reauthenticateAccount: mockLogin}),
}))
jest.mock('#/components/Toast', () => {
  const {View, Text, Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    show: (...args: unknown[]) => mockShow(...args),
    Outer: View,
    Text,
    Icon: () => null,
    Action: ({children, onPress}: {children: React.ReactNode; onPress: () => void}) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  }
})

import {useEphemeralAccountError} from '#/components/hooks/useEphemeralAccountError'

const account: SessionAccount = {did: 'did:plc:alternate', handle: 'alternate.test', service: 'https://pds.test'}
const i18n = setupI18n({locale: 'en', messages: {en: {}}})
function Probe() {
  const showError = useEphemeralAccountError()
  return (
    <Pressable accessibilityRole="button" onPress={() => showError({status: 401}, account, mockRetry)}>
      <Text>Fail action</Text>
    </Pressable>
  )
}

it('offers explicit login for the selected account then resumes the action only after successful login', async () => {
  mockLogin.mockResolvedValue(account)
  const ui = render(<I18nProvider i18n={i18n}><Probe /></I18nProvider>)
  fireEvent.press(screen.getByText('Fail action'))
  expect(mockLogin).not.toHaveBeenCalled()
  const [notification] = mockShow.mock.calls[0]
  ui.rerender(<I18nProvider i18n={i18n}>{notification}</I18nProvider>)
  fireEvent.press(screen.getByText('Login'))
  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith(account))
  await waitFor(() => expect(mockRetry).toHaveBeenCalledWith(account))
  expect(mockLogin).toHaveBeenCalledTimes(1)
})

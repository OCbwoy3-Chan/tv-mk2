import {createContext} from 'react'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render, screen} from '@testing-library/react-native'

import {ScreenID} from '../types'

const mockSessionContext = createContext(true)
let mockIsOauth = true
const mockControl = {value: {id: ScreenID.Manage2FA}, clear() {}, control: {}}
jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: {
      isOauthSession: jest
        .requireActual<typeof import('react')>('react')
        .useContext(mockSessionContext),
    },
  }),
}))
jest.mock('#/alf', () => ({web: (style: unknown) => style}))
jest.mock('#/components/Dialog', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Outer: View,
    Handle: () => null,
    ScrollableInner: View,
    Close: () => null,
  }
})
jest.mock('#/components/dialogs/Context', () => ({
  useGlobalDialogsControlContext: () => ({emailDialogControl: mockControl}),
}))
jest.mock('../data/useAccountEmailState', () => ({
  useAccountEmailState: () => ({isEmailVerified: true}),
}))
jest.mock('#/components/dialogs/LegacyAuthRequiredDialog', () => ({
  LegacyAuthRequiredDialogContent: () => {
    const {Text} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <Text>password authentication</Text>
  },
}))
jest.mock('#/components/dialogs/OAuthPermissionGate', () => ({
  OAuthPermissionGate: ({children}: {children: React.ReactNode}) => {
    const {Text, View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return (
      <View>
        <Text>oauth permission</Text>
        {children}
      </View>
    )
  },
}))
jest.mock('../screens/Manage2FA', () => ({
  Manage2FA: () => {
    const {Text} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <Text>2fa settings</Text>
  },
}))
jest.mock('../screens/Update', () => ({Update: () => null}))
jest.mock('../screens/Verify', () => ({Verify: () => null}))
jest.mock('../screens/VerificationReminder', () => ({
  VerificationReminder: () => null,
}))

import {EmailDialog} from '../index'

function content() {
  return (
    <mockSessionContext.Provider value={mockIsOauth}>
      <I18nProvider i18n={setupI18n({locale: 'en', messages: {en: {}}})}>
        <EmailDialog />
      </I18nProvider>
    </mockSessionContext.Provider>
  )
}

beforeEach(() => {
  mockIsOauth = true
})
it.each([ScreenID.Update, ScreenID.Manage2FA])(
  'requires password auth for %s without requesting unusable OAuth access',
  id => {
    mockControl.value.id = id
    render(content())
    expect(screen.getByText('password authentication')).toBeTruthy()
    expect(screen.queryByText('oauth permission')).toBeNull()
    expect(screen.queryByText('2fa settings')).toBeNull()
  },
)
it('continues into 2fa settings after password authentication', () => {
  mockControl.value.id = ScreenID.Manage2FA
  const view = render(content())
  mockIsOauth = false
  view.rerender(content())
  expect(screen.getByText('2fa settings')).toBeTruthy()
  expect(screen.queryByText('password authentication')).toBeNull()
})
it('still requests granular OAuth access for email verification', () => {
  mockControl.value.id = ScreenID.Verify
  render(content())
  expect(screen.getByText('oauth permission')).toBeTruthy()
  expect(screen.queryByText('password authentication')).toBeNull()
})

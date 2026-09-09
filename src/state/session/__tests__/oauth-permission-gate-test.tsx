import {Text} from 'react-native'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'

const mockLogin = jest.fn()
const mockRestore = jest.fn()
const mockReauthenticate = jest.fn()
const did = 'did:plc:alice'

jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: {did: 'did:plc:alice', isOauthSession: true},
  }),
  useSessionApi: () => ({resumeSession: mockLogin, reauthenticateAccount: mockReauthenticate}),
}))
jest.mock('../oauth-client-adapter', () => ({
  restoreOAuthSession: (...args: unknown[]) => mockRestore(...args),
}))
jest.mock('../oauth-scopes', () => ({
  getOAuthScope: (permissions: string[]) =>
    ['atproto', ...permissions].join(' '),
}))
let mockIsWeb = false
jest.mock('#/env', () => ({
  get IS_WEB() {
    return mockIsWeb
  },
}))
jest.mock('#/alf', () => ({atoms: {}, web: (style: unknown) => style}))
jest.mock('#/components/Dialog', () => ({
  Handle: () => null,
  Close: () => null,
  ScrollableInner: ({children}: {children: React.ReactNode}) => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="permission-dialog-surface">{children}</View>
  },
}))
jest.mock('#/components/Admonition', () => ({
  Admonition:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Button', () => ({
  Button:
    jest.requireActual<typeof import('react-native')>('react-native').Pressable,
  ButtonText:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))

import {OAuthPermissionGate} from '#/components/dialogs/OAuthPermissionGate'

function showGate(standalone = false) {
  const i18n = setupI18n({locale: 'en', messages: {en: {}}})
  return render(
    <I18nProvider i18n={i18n}>
      <OAuthPermissionGate permission="handle" standalone={standalone}>
        <Text>handle editor</Text>
      </OAuthPermissionGate>
    </I18nProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsWeb = false
  mockRestore.mockResolvedValue({
    getTokenInfo: () =>
      Promise.resolve({scope: 'atproto account:email?action=manage'}),
  })
  mockLogin.mockResolvedValue(undefined)
})

it('opens the login chooser and retains optional access without starting OAuth', async () => {
  let finishLogin!: (account: unknown) => void
  mockReauthenticate.mockReturnValue(new Promise(resolve => { finishLogin = resolve }))
  showGate()
  fireEvent.press(await screen.findByText('Continue to authorization'))
  expect(mockReauthenticate).toHaveBeenCalledWith(
    {did, isOauthSession: true}, {scope: 'atproto handle email'},
  )
  expect(mockLogin).not.toHaveBeenCalled()
  expect(screen.queryByText('handle editor')).toBeNull()
  mockRestore.mockResolvedValue({
    getTokenInfo: () => Promise.resolve({scope: 'atproto identity:handle'}),
  })
  finishLogin({did, isOauthSession: true})
  await screen.findByText('handle editor')
  expect(mockLogin).toHaveBeenCalledTimes(1)
})

it.each(['cancelled', 'missing permission', 'wrong account'])(
  'keeps the action blocked after %s',
  async reason => {
    if (reason === 'missing permission')
      mockReauthenticate.mockResolvedValue({did, isOauthSession: true})
    else mockReauthenticate.mockRejectedValue(new Error(reason))
    showGate()
    fireEvent.press(await screen.findByText('Continue to authorization'))
    await waitFor(() => expect(mockReauthenticate).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByText('Continue to authorization')).toBeTruthy())
    expect(mockLogin).not.toHaveBeenCalled()
    expect(screen.queryByText('handle editor')).toBeNull()
  },
)

it('accepts a legacy session chosen from the login form', async () => {
  mockReauthenticate.mockResolvedValue({did, isOauthSession: false})
  showGate()
  fireEvent.press(await screen.findByText('Continue to authorization'))
  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({did, isOauthSession: false}))
})

it('gives standalone permission prompts a proper dialog surface', async () => {
  showGate(true)
  await screen.findByText('Continue to authorization')
  expect(screen.getByTestId('permission-dialog-surface')).toBeTruthy()
})

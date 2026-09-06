import {Text} from 'react-native'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'

const mockLogin = jest.fn()
const mockRestore = jest.fn()
const mockSignIn = jest.fn()
const did = 'did:plc:alice'

jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: {did: 'did:plc:alice', isOauthSession: true},
  }),
  useSessionApi: () => ({login: mockLogin}),
}))
jest.mock('../oauth-client-adapter', () => ({
  restoreOAuthSession: (...args: unknown[]) => mockRestore(...args),
}))
jest.mock('../oauth-native-sign-in', () => ({
  signInNative: (...args: unknown[]) => mockSignIn(...args),
}))
jest.mock('../oauth-web-client', () => ({
  getWebOAuthClient: () => ({signIn: mockSignIn}),
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

it('waits for an explicit action and retains previously granted optional access', async () => {
  mockSignIn.mockResolvedValue({
    did,
    getTokenInfo: () =>
      Promise.resolve({
        scope: 'atproto identity:handle account:email?action=manage',
      }),
  })
  showGate()
  await screen.findByText('Continue to authorization')
  expect(mockSignIn).not.toHaveBeenCalled()
  expect(screen.queryByText('handle editor')).toBeNull()
  fireEvent.press(screen.getByText('Continue to authorization'))
  await screen.findByText('handle editor')
  expect(mockSignIn).toHaveBeenCalledWith(did, {scope: 'atproto handle email'})
  expect(mockLogin).toHaveBeenCalledTimes(1)
})

it.each(['cancelled', 'missing permission', 'wrong account'])(
  'keeps the action blocked after %s',
  async reason => {
    if (reason === 'cancelled')
      mockSignIn.mockRejectedValue(new Error('cancelled'))
    else
      mockSignIn.mockResolvedValue({
        did: reason === 'wrong account' ? 'did:plc:bob' : did,
        getTokenInfo: () =>
          Promise.resolve({
            scope:
              reason === 'missing permission'
                ? 'atproto'
                : 'atproto identity:handle',
          }),
      })
    showGate()
    fireEvent.press(await screen.findByText('Continue to authorization'))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getByText('Continue to authorization')).toBeTruthy(),
    )
    expect(mockLogin).not.toHaveBeenCalled()
    expect(screen.queryByText('handle editor')).toBeNull()
  },
)

it('uses a popup on web so the action dialog survives authorization', async () => {
  mockIsWeb = true
  mockSignIn.mockResolvedValue({
    did,
    getTokenInfo: () => Promise.resolve({scope: 'atproto identity:handle'}),
  })
  showGate()
  fireEvent.press(await screen.findByText('Continue to authorization'))
  await screen.findByText('handle editor')
  expect(mockSignIn).toHaveBeenCalledWith(did, {
    scope: 'atproto handle email',
    display: 'popup',
  })
})

it('gives standalone permission prompts a proper dialog surface', async () => {
  showGate(true)
  await screen.findByText('Continue to authorization')
  expect(screen.getByTestId('permission-dialog-surface')).toBeTruthy()
})

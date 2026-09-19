import {render} from '@testing-library/react-native'

import {Link} from './Link'

jest.mock('#/env', () => ({IS_WEB: true, IS_NATIVE: false, IS_IOS: false}))
jest.mock('#/alf', () => ({
  atoms: {},
  web: (value: unknown) => value,
}))
jest.mock('#/components/Button', () => ({
  Button:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('#/components/Typography', () => ({Text: 'Text'}))
jest.mock('#/components/PeekMenu', () => ({}))
jest.mock('#/components/icons/ArrowShareRight', () => ({}))
jest.mock('#/components/hooks/useInteractionState', () => ({}))
jest.mock('#/lib/constants', () => ({}))
jest.mock('#/lib/hooks/useIntentHandler', () => ({
  useGroupChatJoinIntent: () => jest.fn(),
}))
jest.mock('#/lib/hooks/useNavigationDeduped', () => ({
  useNavigationDeduped: () => ({}),
}))
jest.mock('#/lib/hooks/useOpenLink', () => ({
  useOpenLink: () => jest.fn(),
}))
jest.mock('#/lib/sharing', () => ({}))
jest.mock('#/lib/strings/url-helpers', () => ({
  convertBskyAppUrlIfNeeded: (url: string) => url,
  isExternalUrl: () => false,
}))
jest.mock('#/state/preferences', () => ({useGoLinksEnabled: () => false}))
jest.mock('#/state/preferences/in-app-browser', () => ({}))
jest.mock('#/routes', () => ({}))
jest.mock('#/components/dialogs/Context', () => ({
  useGlobalDialogsControlContext: () => ({}),
}))

it('preserves navigation markers on notification and list links', () => {
  const {getByTestId} = render(
    <Link
      to="/profile/example.test"
      label="Notification"
      testID="notification"
      dataSet={{keyboardNavigationItem: 'true'}}>
      <></>
    </Link>,
  )

  expect(getByTestId('notification').props.dataSet).toEqual({
    keyboardNavigationItem: 'true',
    noUnderline: '1',
  })
})

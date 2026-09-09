import {Text, View} from 'react-native'
import {render, within} from '@testing-library/react-native'

import {Outlet, Portal, Provider} from '#/components/Portal'

const {
  EphemeralLoginContainer,
}: typeof import('../EphemeralLoginContainer') = require('../EphemeralLoginContainer.web.tsx')

it('keeps nested login dialogs inside the login modal instead of the app outlet', () => {
  const screen = render(
    <Provider>
      <View testID="app-outlet">
        <Outlet />
      </View>
      <EphemeralLoginContainer onClose={() => {}}>
        <Portal>
          <Text>App server dialog</Text>
        </Portal>
      </EphemeralLoginContainer>
    </Provider>,
  )
  expect(screen.getByText('App server dialog')).toBeTruthy()
  expect(
    within(screen.getByTestId('app-outlet')).queryByText('App server dialog'),
  ).toBeNull()
})

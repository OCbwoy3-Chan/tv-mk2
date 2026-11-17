import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {FlatNavigatorParams} from '#/lib/routes/types'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {deltaDeferredNamedScreen} from './DeltaNavigationLib'

export type DeltasNavigatorParams = {
  DeltasSettings: undefined
  DeltasDecorationsSettingsScreen: undefined
  DeltasBadgeSettingsScreen: undefined
}

const Flat = createNativeStackNavigatorWithAuth<
  FlatNavigatorParams & DeltasNavigatorParams
>()

export const DeltasRoutes: Record<
  keyof DeltasNavigatorParams,
  string | string[]
> = {
  DeltasSettings: '/settings/deltas',
  DeltasBadgeSettingsScreen: '/settings/deltas/badge',
  DeltasDecorationsSettingsScreen: '/settings/deltas/decorations',
}

const DeltasSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas'),
  'DeltasSettingsScreen',
)

const DeltasBadgeSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas/BadgeSettingsScreen'),
  'DeltasBadgeSettingsScreen',
)

const DeltasDecorationsSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas/Decorations'),
  'DeltasDecorationsSettingsScreen',
)

export function DeltasCommonStacks({
  props: {Stack, title},
}: {
  props: {
    Stack: typeof Flat
    unreadCountLabel?: string
    title: (page: MessageDescriptor) => string
  }
}) {
  return (
    <>
      <Stack.Screen
        name="DeltasSettings"
        getComponent={() => DeltasSettingsScreen}
        options={{title: title(msg`Deltas`)}}
      />
      <Stack.Screen
        name="DeltasBadgeSettingsScreen"
        getComponent={() => DeltasBadgeSettingsScreen}
        options={{title: title(msg`Badge settings`)}}
      />
      <Stack.Screen
        name="DeltasDecorationsSettingsScreen"
        getComponent={() => DeltasDecorationsSettingsScreen}
        options={{title: title(msg`Profile decorations`)}}
      />
    </>
  )
}

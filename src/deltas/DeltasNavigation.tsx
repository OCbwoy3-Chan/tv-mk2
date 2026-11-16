import {FlatNavigatorParams} from '#/lib/routes/types'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {deltaDeferredNamedScreen} from './DeltaNavigationLib'

export type DeltasNavigatorParams = {
  DeltasSettings: undefined
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
}

const DeltasSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas'),
  'DeltasSettingsScreen',
)

const DeltasBadgeSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas/BadgeSettingsScreen'),
  'DeltasBadgeSettingsScreen',
)

export function DeltasCommonStacks({
  props: {Stack, unreadCountLabel, title},
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
    </>
  )
}

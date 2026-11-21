import { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'

import { FlatNavigatorParams } from '#/lib/routes/types'
import { createNativeStackNavigatorWithAuth } from '#/view/shell/createNativeStackNavigatorWithAuth'
import { deltaDeferredNamedScreen } from './lib/DeltaNavigationLib'

export type DeltasNavigatorParams = {
  DeltasSettings: undefined
  DeltasDecorationsSettingsScreen: undefined
  DeltasBadgeSettingsScreen: undefined
  DeltasModerationSettingsScreen: undefined
  AppQuirksSettingsScreen: undefined
  DeltasPlusSettingsScreen: undefined
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
  DeltasModerationSettingsScreen: '/settings/deltas/moderation',
  AppQuirksSettingsScreen: '/settings/deltas/app',
  DeltasDecorationsSettingsScreen: '/settings/deltas/decorations',
  DeltasPlusSettingsScreen: '/settings/deltas/plus',
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

const DeltasModerationSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas/ModerationSettingsScreen'),
  'DeltasModerationSettingsScreen',
)

const AppQuirksSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas/AppQuirksSettingsScreen'),
  'DeltasAppQuirksSettingsScreen',
)

const DeltasPlusSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas/DeltasPlus/DeltasPlusSettingsScreen'),
  'DeltasPlusSettingsScreen',
)

export function DeltasCommonStacks({
  props: { Stack, title },
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
        options={{ title: title(msg`Deltas`) }}
      />
      <Stack.Screen
        name="DeltasBadgeSettingsScreen"
        getComponent={() => DeltasBadgeSettingsScreen}
        options={{ title: title(msg`Badge settings`) }}
      />
      <Stack.Screen
        name="DeltasDecorationsSettingsScreen"
        getComponent={() => DeltasDecorationsSettingsScreen}
        options={{ title: title(msg`Profile decorations`) }}
      />
      <Stack.Screen
        name="DeltasModerationSettingsScreen"
        getComponent={() => DeltasModerationSettingsScreen}
        options={{ title: title(msg`Moderation`) }}
      />
      <Stack.Screen
        name="AppQuirksSettingsScreen"
        getComponent={() => AppQuirksSettingsScreen}
        options={{ title: title(msg`App`) }}
      />
      <Stack.Screen
        name="DeltasPlusSettingsScreen"
        getComponent={() => DeltasPlusSettingsScreen}
        options={{ title: title(msg`Deltas+`) }}
      />
    </>
  )
}

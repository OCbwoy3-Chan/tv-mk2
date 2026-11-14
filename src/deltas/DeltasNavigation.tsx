import { FlatNavigatorParams } from "#/lib/routes/types"
import { createNativeStackNavigatorWithAuth } from "#/view/shell/createNativeStackNavigatorWithAuth"
import { MessageDescriptor } from "@lingui/core"
import { msg } from "@lingui/core/macro"
import { deltaDeferredNamedScreen } from "./DeltaNavigationLib"

export type DeltasNavigatorParams = {
    DeltasSettings: undefined
}

const Flat = createNativeStackNavigatorWithAuth<FlatNavigatorParams & DeltasNavigatorParams>()

export const DeltasRoutes:  Record<keyof DeltasNavigatorParams, string | string[]> = {
    DeltasSettings: "/settings/deltas"
}

const DeltasSettingsScreen = deltaDeferredNamedScreen(
  () => require('#/screens/Settings/Deltas'),
  'DeltasSettingsScreen',
)

export function DeltasCommonStacks({
    props: {
        Stack,
        unreadCountLabel,
        title
    }
}: {
    props: {
        Stack: typeof Flat,
        unreadCountLabel?: string,
        title: (page: MessageDescriptor) => string
    }
}) {
    return <>
        <Stack.Screen
            name="DeltasSettings"
            getComponent={() => DeltasSettingsScreen}
            options={{ title: title(msg`Deltas`) }}
        />
    </>
}
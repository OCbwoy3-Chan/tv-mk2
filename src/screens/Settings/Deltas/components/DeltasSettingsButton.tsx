import { Trans, useLingui } from "@lingui/react/macro"
import * as SettingsList from "../../components/SettingsList"
import { CustomBadgeIcon } from "./CustomBadgeIcon";

/** ONLY FOR USE IN SETTINGS. Button that reads "Deltas". Must always be above the "Runes" button. */
export function DeltasSettingsButton() {
    const {t: l} = useLingui();

    const badgeIcon = <CustomBadgeIcon source={require("#/../assets/badges/kris.png")}/>

    return <SettingsList.LinkItem to="/settings/deltas" label={l`Deltas`}>
        <SettingsList.ItemIcon icon={()=>badgeIcon} />
        <SettingsList.ItemText>
            <Trans>Deltas</Trans>
        </SettingsList.ItemText>
    </SettingsList.LinkItem>
}
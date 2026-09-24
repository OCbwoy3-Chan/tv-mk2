import { atoms as a, useTheme } from "#/alf";
import { Admonition } from "#/components/Admonition";
import { Trans } from "@lingui/react/macro";
import { View } from "react-native";
import { Text } from '#/components/Typography'
import { Button } from "#/components/Button";
import { useAgent } from "#/state/session";
import { isSpacesCompatiblePDS } from "#/lib/spaces";

export function PrivatePostPlayground() {
    const t = useTheme();
    const agent = useAgent();
    return <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>
                <Trans>Private posts debug</Trans>
            </Text>
        </View>
        <Admonition type="warning">
            <Trans>
                Super unstable, do not use!
            </Trans>
        </Admonition>
        <Button onPress={async()=>{
            try {
                const r = await isSpacesCompatiblePDS(agent)
                console.log("spaces compat check:",r);
            } catch(a_) {
                console.log(a_)
            }
        }} style={[t.atoms.bg_contrast_50, a.rounded_lg, a.p_sm]} label="check spaces compatibility">
            <Text>check spaces compatibility</Text>
        </Button>
    </View>
}
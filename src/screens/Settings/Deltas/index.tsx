import { Trans, useLingui } from '@lingui/react/macro'
import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import { DeltasNavigatorParams } from '#/deltas/DeltasNavigation'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { atoms as a, useBreakpoints, useTheme } from '#/alf'
import { Admonition } from '#/components/Admonition'
import { RunesScreenLayout } from '../RunesSettings/components/RunesScreenLayout'
import { createStaticClick, InlineLinkText, Link } from '#/components/Link'
import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped'
import { View } from 'react-native'
import { Text } from '#/components/Typography'
import { DeltasSubItem } from './components/SettingsSubItem'
import { Divider } from '#/components/Divider'
import { PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon } from '#/components/icons/PaintRoller'
import { UserCircle_Stroke2_Corner0_Rounded as UserCircleIcon } from '#/components/icons/UserCircle'
import { ShieldCheck_Stroke2_Corner0_Rounded as ShieldCheckIcon } from '#/components/icons/Shield'
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag'
import { useSession } from '#/state/session'
import { useVipStatusQuery } from '#/deltas/lib/vipEntitlement'
import { Star_Stroke2_Corner0_Rounded as StarIcon } from '#/components/icons/Star'

type Props = NativeStackScreenProps<DeltasNavigatorParams>

export function DeltasSettingsScreen({ }: Props) {
    const { t: l } = useLingui()
    const t = useTheme();
    const { gtMobile } = useBreakpoints();
    const navigation = useNavigationDeduped();

    const user = useSession();
    const hasVip = useVipStatusQuery(user.currentAccount?.did);

    return (
        <RunesScreenLayout titleText="Deltas">
            <SettingsList.Item>
                <Admonition type="info" style={[a.flex_1]}>
                    The development is still work-in-progress.
                    Private posts have been dropped in preperation for{" "}
                    <InlineLinkText
                        {...createStaticClick(() =>
                            navigation.navigate("PostThread", {
                                name: "did:plc:gsbue2dtbtqzw5du5btlh7p2",
                                rkey: "3mnxh6mmlxk2k"
                            }),
                        )}
                        label={l`Bluesky Communities`}
                    >
                        Bluesky Communities
                    </InlineLinkText>.
                </Admonition>
            </SettingsList.Item>

            <View style={[a.pt_lg, a.px_lg, gtMobile && a.px_2xl]}>
                <Text
                    style={[
                        a.text_md,
                        a.font_semi_bold,
                        a.pb_md,
                        t.atoms.text_contrast_high,
                    ]}>
                    <Trans>Profile customization</Trans>
                </Text>

                <View
                    style={[
                        a.w_full,
                        a.rounded_md,
                        a.overflow_hidden,
                        t.atoms.bg_contrast_25,
                    ]}>

                    <Link
                        label={l`View or edit your profile badge`}
                        to="/settings/deltas/badge"
                    >
                        {state => (
                            <DeltasSubItem
                                title={l`Badge settings`}
                                icon={UserCircleIcon}
                                style={[
                                    (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                                ]}
                            />
                        )}
                    </Link>

                    <Divider />

                    <Link
                        label={l`View or edit your profile decorations`}
                        to="/settings/deltas/decorations"
                    >
                        {state => (
                            <DeltasSubItem
                                title={l`Profile Decorations`}
                                icon={PaintRollerIcon}
                                style={[
                                    (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                                ]}
                            />
                        )}
                    </Link>
                </View>
            </View>

            <View style={[a.pt_lg, a.px_lg, gtMobile && a.px_2xl]}>
                <Text
                    style={[
                        a.text_md,
                        a.font_semi_bold,
                        a.pb_md,
                        t.atoms.text_contrast_high,
                    ]}>
                    <Trans>Quirks</Trans>
                </Text>

                <View
                    style={[
                        a.w_full,
                        a.rounded_md,
                        a.overflow_hidden,
                        t.atoms.bg_contrast_25,
                    ]}>

                    <Link
                        label={l`Moderation settings`}
                        to="/settings/deltas/moderation"
                    >
                        {state => (
                            <DeltasSubItem
                                title={l`Moderation`}
                                icon={ShieldCheckIcon}
                                style={[
                                    (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                                ]}
                            />
                        )}
                    </Link>

                    <Divider />

                    <Link
                        label={l`App quirks settings`}
                        to="/settings/deltas/app"
                    >
                        {state => (
                            <DeltasSubItem
                                title={l`App`}
                                icon={HashtagIcon}
                                style={[
                                    (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                                ]}
                            />
                        )}
                    </Link>

                    {hasVip && <>
                        <Divider />

                        <Link
                            label={l`Deltas+ settings`}
                            to="/settings/deltas/plus"
                        >
                            {state => (
                                <DeltasSubItem
                                    title={l`Deltas+`}
                                    icon={StarIcon}
                                    style={[
                                        (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                                    ]}
                                />
                            )}
                        </Link>
                    </>}
                </View>
            </View>
        </RunesScreenLayout>
    )
}

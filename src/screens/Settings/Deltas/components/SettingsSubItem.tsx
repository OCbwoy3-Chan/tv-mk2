import { atoms as a, useTheme, ViewStyleProp } from "#/alf"
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from "#/components/icons/Chevron"
import { type Props as SVGIconProps } from '#/components/icons/common'
import { Text } from '#/components/Typography'
import { accentForeground } from "#/features/themes/accentForeground"
import { UNREAD_NOTIFICATION_CAP } from "#/lib/constants"
import { plural } from "@lingui/core/macro"
import { useLingui } from "@lingui/react/macro"
import { View } from "react-native"

export function DeltasSubItem({
    title,
    icon: Icon,
    badge,
    style,
}: ViewStyleProp & {
    title: string
    icon: React.ComponentType<SVGIconProps>
    badge?: number
}) {
    const t = useTheme()
    const { t: l, i18n } = useLingui()
    return (
        <View
            style={[
                a.w_full,
                a.flex_row,
                a.align_center,
                a.justify_between,
                a.p_lg,
                a.gap_sm,
                style,
            ]}>
            <View style={[a.flex_row, a.align_center, a.gap_md]}>
                <Icon size="md" style={[t.atoms.text_contrast_medium]} />
                <Text style={[a.text_sm, a.font_semi_bold]}>{title}</Text>
            </View>
            <View style={[a.flex_row, a.align_center, a.gap_md]}>
                {badge ? (
                    <View
                        style={[
                            a.rounded_lg,
                            a.align_center,
                            a.justify_center,
                            a.px_sm,
                            {
                                minWidth: 24,
                                height: 24,
                                backgroundColor: t.palette.primary_500,
                            },
                        ]}>
                        <Text
                            style={[
                                a.text_xs,
                                a.font_semi_bold,
                                {
                                    color: accentForeground(t, t.palette.primary_500),
                                    fontVariant: ['tabular-nums'],
                                },
                            ]}>
                            {badge >= UNREAD_NOTIFICATION_CAP
                                ? l({
                                    message: `${i18n.number(UNREAD_NOTIFICATION_CAP - 1)}+ updates`,
                                    comment:
                                        'Displayed when the number of notifications exceeds the cap – for example, 99+ notifications',
                                })
                                : plural(badge, {
                                    one: '# update',
                                    other: '# updates',
                                })}
                        </Text>
                    </View>
                ) : null}
                <ChevronRight size="sm" style={[t.atoms.text_contrast_low]} />
            </View>
        </View>
    )
}
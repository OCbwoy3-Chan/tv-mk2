import { atoms as a, useTheme } from "#/alf";
import { Text } from "#/components/Typography";
import { DECORATION_FRAMES, getFrame, NAME_GRADIENTS, NameGradient, nameGradientTextStyle, useMyDecorationSettingsQuery, useSetDecorations } from "#/features/avatarDecorations";
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { sanitizeDisplayName } from "#/lib/strings/display-names";
import { sanitizeHandle } from "#/lib/strings/handles";
import { useCurrentAccountProfile } from "#/state/queries/useCurrentAccountProfile";
import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { View } from "react-native";
import * as Toast from '#/components/Toast'
import { Loader } from "#/components/Loader";
import { Button, ButtonText } from "#/components/Button";
import { Pressable } from "#/components/Pressable";
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from "#/components/icons/Check";
import { LinearGradient } from "expo-linear-gradient";
import * as Toggle from "#/components/forms/Toggle";

export function DecorationSettings() {
    const t = useTheme();
    const { i18n, t: l } = useLingui()
    const profile = useCurrentAccountProfile();
    const name = sanitizeDisplayName(
        profile?.displayName || sanitizeHandle(profile?.handle || "kris"),
    )
    const capitalizedName = name.replace(/(^|\s)(\S)/gu, (_, space: string, letter: string) =>
        space + letter.toLocaleUpperCase(),
    );

    const settings = useMyDecorationSettingsQuery()
    const saved = settings.data ?? {}
    const setDecorations = useSetDecorations()

    const [picked, setPicked] = useState<string | undefined>(undefined)
    const [frame, setFrame] = useState<string | undefined>(undefined)
    const [outline, setOutline] = useState(false)
    const [touched, setTouched] = useState(false)
    const selectedFrame = touched ? frame : saved.avatar
    const selectedId = touched ? picked : saved.name
    const selectedOutline = touched ? outline : !!saved.nameOutline
    const selected = NAME_GRADIENTS.find(g => g.id === selectedId)
    const dirty =
        touched &&
        (picked !== saved.name ||
            outline !== !!saved.nameOutline ||
            frame !== saved.avatar)

    function choose(id: string | undefined) {
        setFrame(selectedFrame)
        setPicked(id)
        setOutline(selectedOutline)
        setTouched(true)
    }

    function toggleOutline(value: boolean) {
        setFrame(selectedFrame)
        setPicked(selectedId)
        setOutline(value)
        setTouched(true)
    }

    function onSave() {
        setDecorations.mutate(
            { avatar: selectedFrame, name: selectedId, nameOutline: selectedOutline },
            {
                onSuccess: () => {
                    setTouched(false)
                    Toast.show(l`Saved`)
                },
                onError: () => Toast.show(l`Could not save. Try again.`),
            },
        )
    }

    return <>
        <View
            style={[
                a.mx_xl,
                a.mt_md,
                a.mb_lg,
                a.p_xl,
                a.rounded_md,
                a.align_center,
                a.justify_center,
                t.atoms.bg_contrast_25,
            ]}>
            <UserAvatar
                type="user"
                size={80}
                avatar={profile?.avatar}
                decoration={getFrame(selectedFrame)}
            />
        </View>
        {settings.isLoading && <Loader />}
        {settings.error && (
            <Button
                label={l`Try again`}
                size="small"
                color="secondary"
                onPress={() => void settings.refetch()}>
                <ButtonText>
                    <Trans>Could not load your decorations. Try again.</Trans>
                </ButtonText>
            </Button>
        )}
        {settings.isSuccess && (
            <>
                <Text style={[a.text_md, a.mb_sm, a.font_semi_bold, t.atoms.text_contrast_medium, a.px_xl]}>
                    <Trans>Profile frames</Trans>
                </Text>
                <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.px_xl]}>
                    {[undefined, ...DECORATION_FRAMES].map(item => (
                        <Button
                            key={item?.id ?? 'none'}
                            label={item ? i18n._(item.name) : l`No frame`}
                            testID={`decoration-frame-${item?.id ?? 'none'}`}
                            accessibilityState={{ selected: selectedFrame === item?.id }}
                            color={selectedFrame === item?.id ? 'primary' : 'secondary'}
                            size="small"
                            onPress={() => {
                                setFrame(item?.id)
                                setPicked(selectedId)
                                setOutline(selectedOutline)
                                setTouched(true)
                            }}>
                            <ButtonText>
                                {item ? i18n._(item.name) : <Trans>No frame</Trans>}
                            </ButtonText>
                        </Button>
                    ))}
                </View>
                <View
                    style={[
                        a.mx_xl,
                        a.mt_2xl,
                        a.mb_lg,
                        a.p_xl,
                        a.rounded_md,
                        a.align_center,
                        a.justify_center,
                        t.atoms.bg_contrast_25,
                    ]}>
                    <Text style={[
                        a.text_2xl,
                        a.font_bold,
                        t.atoms.text_contrast_medium
                    ]}>
                        {'Hello, I\'m '}
                        <View style={[
                            selected &&
                            nameGradientTextStyle(selected, { outline: selectedOutline })
                        ]}>{capitalizedName}</View>{"!"}
                    </Text>
                </View>
                <Text
                    style={[
                        a.text_md,
                        a.mb_sm,
                        a.font_semi_bold,
                        t.atoms.text_contrast_medium,
                        a.px_xl
                    ]}>
                    <Trans>Display name gradients</Trans>
                </Text>
                <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.px_xl]}>
                    <NoneSwatch
                        selected={!selectedId}
                        onPress={() => choose(undefined)}
                    />
                    {NAME_GRADIENTS.map(g => (
                        <GradientSwatch
                            key={g.id}
                            gradient={g}
                            selected={selectedId === g.id}
                            onPress={() => choose(g.id)}
                        />
                    ))}
                </View>
                <View style={[a.px_xl, a.pt_lg]}>
                    <Toggle.Item
                        name="deco_name_outline"
                        label={l`Outline`}
                        value={selectedOutline}
                        disabled={!selectedId}
                        onChange={toggleOutline}
                        style={[a.w_full]}>
                        <Toggle.LabelText style={[a.flex_1]}>
                            <Trans>Outline</Trans>
                        </Toggle.LabelText>
                        <Toggle.Platform />
                    </Toggle.Item>
                    <Text
                        style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
                        <Trans>
                            Adds a dark edge so the name pops on any background.
                        </Trans>
                    </Text>
                </View>
                <View style={[a.px_xl, a.pt_xl, a.pb_xl]}>
                    <Button
                        testID="saveDecorations"
                        label={l`Save`}
                        size="large"
                        color="primary"
                        disabled={
                            !dirty || setDecorations.isPending || !settings.isSuccess
                        }
                        onPress={onSave}>
                        <ButtonText>
                            {setDecorations.isPending ? (
                                <Trans>Saving…</Trans>
                            ) : (
                                <Trans>Save</Trans>
                            )}
                        </ButtonText>
                    </Button>
                </View>
            </>
        )}
    </>
}

const SWATCH_HEIGHT = 52

function GradientSwatch({
    gradient,
    selected,
    onPress,
}: {
    gradient: NameGradient
    selected: boolean
    onPress: () => void
}) {
    const { i18n } = useLingui()
    const t = useTheme()
    return (
        <Pressable
            accessibilityRole="button"
            testID={`decoration-gradient-${gradient.id}`}
            accessibilityLabel={i18n._(gradient.name)}
            accessibilityHint=""
            accessibilityState={{ selected }}
            onPress={onPress}
            style={[
                a.rounded_md,
                a.overflow_hidden,
                { height: SWATCH_HEIGHT, flexBasis: '31%', flexGrow: 1 },
                selected && {
                    borderWidth: 2,
                    borderColor: t.atoms.text.color,
                },
            ]}>
            <LinearGradient
                colors={gradient.colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[a.absolute, a.inset_0]}
            />
            <View style={[a.flex_1, a.align_center, a.justify_center, a.px_sm]}>
                <Text
                    numberOfLines={1}
                    style={[
                        a.text_sm,
                        a.font_bold,
                        {
                            color: '#FFFFFF',
                            textShadowColor: 'rgba(0,0,0,0.35)',
                            textShadowRadius: 3,
                        },
                    ]}>
                    {i18n._(gradient.name)}
                </Text>
                {selected && (
                    <View
                        style={[
                            a.absolute,
                            a.rounded_full,
                            a.align_center,
                            a.justify_center,
                            {
                                top: 4,
                                right: 4,
                                width: 18,
                                height: 18,
                                backgroundColor: 'rgba(0,0,0,0.35)',
                            },
                        ]}>
                        <CheckIcon size="xs" fill="#FFFFFF" />
                    </View>
                )}
            </View>
        </Pressable>
    )
}

function NoneSwatch({
    selected,
    onPress,
}: {
    selected: boolean
    onPress: () => void
}) {
    const { t: l } = useLingui()
    const t = useTheme()
    return (
        <Pressable
            accessibilityRole="button"
            testID="decoration-gradient-none"
            accessibilityLabel={l`None`}
            accessibilityHint=""
            accessibilityState={{ selected }}
            onPress={onPress}
            style={[
                a.rounded_md,
                a.align_center,
                a.justify_center,
                t.atoms.bg_contrast_25,
                { height: SWATCH_HEIGHT, flexBasis: '31%', flexGrow: 1 },
                selected
                    ? { borderWidth: 2, borderColor: t.atoms.text.color }
                    : {
                        borderWidth: 1,
                        borderColor: t.atoms.border_contrast_low.borderColor,
                    },
            ]}>
            <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                <Trans>None</Trans>
            </Text>
        </Pressable>
    )
}

import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { type $Typed, ComAtprotoLabelDefs } from '@atproto/api'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQueryClient } from '@tanstack/react-query'

import { atoms as a, useTheme } from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import { Text } from '#/components/Typography'
import { Button, ButtonText } from '#/components/Button'
import { RQKEY_ROOT as POST_FEED_RQKEY_ROOT } from '#/state/queries/post-feed'
import {
    useProfileQuery,
    useProfileUpdateMutation,
} from '#/state/queries/profile'
import { postThreadQueryKeyRoot } from '#/state/queries/usePostThread/types'
import { useSession } from '#/state/session'
import * as bsky from '#/types/bsky'
import { isDeltaLabel } from '#/components/CrackComponents/Tenna/TennaBadge'

export function FictionkinBadgeSettings() {
    const t = useTheme()
    const { t: l } = useLingui()
    const queryClient = useQueryClient()
    const { currentAccount } = useSession()
    const { data: profile } = useProfileQuery({ did: currentAccount?.did })
    const updateProfile = useProfileUpdateMutation()

    const [selectedChar, setSelectedChar] = useState<string>('kris')
    const [selectedRel, setSelectedRel] = useState<string>('s')
    const [isEnabled, setIsEnabled] = useState<boolean>(false)
    const [isSaved, setIsSaved] = useState<boolean>(false)

    // Initialize from existing label once profile is loaded
    useEffect(() => {
        if (profile) {
            const dl = profile.labels?.find(
                l => l.src === profile.did && isDeltaLabel(l.val).char !== '67'
            )
            if (dl) {
                const p = isDeltaLabel(dl.val)
                setSelectedChar(p.char)
                setSelectedRel(p.kin || 's')
                setIsEnabled(true)
            } else {
                setIsEnabled(false)
            }
        }
    }, [profile])

    const onSave = () => {
        if (!profile) return

        setIsSaved(false)
        const newValue = `dr-${selectedChar}-${selectedRel}`
        const wasAdded = isEnabled

        updateProfile.mutate(
            {
                profile,
                updates: existing => {
                    const labels: $Typed<ComAtprotoLabelDefs.SelfLabels> = bsky.validate(
                        existing.labels,
                        ComAtprotoLabelDefs.validateSelfLabels,
                    )
                        ? existing.labels
                        : {
                            $type: 'com.atproto.label.defs#selfLabels',
                            values: [],
                        }

                    const otherLabels = labels.values.filter(l => !l.val.startsWith('dr-'))
                    if (isEnabled) {
                        labels.values = [...otherLabels, { val: newValue }]
                    } else {
                        labels.values = otherLabels
                    }

                    if (labels.values.length === 0) {
                        delete existing.labels
                    } else {
                        existing.labels = labels
                    }

                    return existing
                },
                checkCommitted: res => {
                    const exists = !!res.data.labels?.some(l => l.val === newValue)
                    return exists === wasAdded
                },
            },
            {
                onSuccess() {
                    queryClient.invalidateQueries({ queryKey: [POST_FEED_RQKEY_ROOT] })
                    queryClient.invalidateQueries({ queryKey: [postThreadQueryKeyRoot] })
                    setIsSaved(true)
                },
            },
        )
    }

    const CHARACTERS = [
        { value: 'kris', label: 'Kris' },
        { value: 'susie', label: 'Susie' },
        { value: 'ralsei', label: 'Ralsei' },
        { value: 'noelle', label: 'Noelle' },
    ]

    const RELATIONSHIPS = [
        { value: 's', label: 'I AM THE CHARACTER!!' },
        { value: 'fictive', label: 'Fictive' },
        { value: 'fictionkin', label: 'Fictionkin' },
    ]

    const canToggle = profile && !updateProfile.isPending

    return (
        <View style={[a.p_xl, a.gap_xl]}>
            <View style={[a.gap_sm]}>
                <Text style={[a.text_2xl, a.font_bold]}>
                    <Trans>The badge</Trans>
                </Text>
                <Text style={[a.text_md, a.leading_snug]}>
                    <Trans>
                        this is a tenna.party exclusive 👀
                    </Trans>
                </Text>
            </View>

            <View
                style={[
                    a.w_full,
                    a.p_md,
                    a.rounded_lg,
                    a.border,
                    t.atoms.border_contrast_low,
                    t.atoms.bg_contrast_50,
                ]}>
                <Toggle.Item
                    name="fictonkin_badge_enabled"
                    disabled={!canToggle}
                    value={isEnabled}
                    onChange={() => {
                        setIsEnabled(!isEnabled)
                        setIsSaved(false)
                    }}
                    label={l`Toggle fictionkin badge`}>
                    <Toggle.LabelText style={[a.flex_1, a.text_md, a.font_medium]}>
                        <Trans>Enable Badge</Trans>
                    </Toggle.LabelText>
                    <Toggle.Platform />
                </Toggle.Item>
            </View>

            {isEnabled && (
                <>
                    <View
                        style={[
                            a.w_full,
                            a.p_md,
                            a.rounded_lg,
                            a.border,
                            t.atoms.border_contrast_low,
                            t.atoms.bg_contrast_50,
                            a.gap_sm,
                        ]}>
                        <Text style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}>
                            <Trans>Character</Trans>
                        </Text>
                        <Toggle.Group
                            type="radio"
                            values={[selectedChar]}
                            onChange={values => {
                                if (values[0]) {
                                    setSelectedChar(values[0])
                                    setIsSaved(false)
                                }
                            }}
                            label={l`Character`}>
                            <View style={[a.gap_sm, a.pt_xs]}>
                                {CHARACTERS.map(c => (
                                    <Toggle.Item key={c.value} name={c.value} label={c.label}>
                                        <Toggle.RadioWithLabel
                                            label={c.label}
                                            selected={selectedChar === c.value}
                                        />
                                    </Toggle.Item>
                                ))}
                            </View>
                        </Toggle.Group>
                    </View>

                    <View
                        style={[
                            a.w_full,
                            a.p_md,
                            a.rounded_lg,
                            a.border,
                            t.atoms.border_contrast_low,
                            t.atoms.bg_contrast_50,
                            a.gap_sm,
                        ]}>
                        <Text style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}>
                            <Trans>Type</Trans>
                        </Text>
                        <Toggle.Group
                            type="radio"
                            values={[selectedRel]}
                            onChange={values => {
                                if (values[0]) {
                                    setSelectedRel(values[0])
                                    setIsSaved(false)
                                }
                            }}
                            label={l`Relationship Type`}>
                            <View style={[a.gap_sm, a.pt_xs]}>
                                {RELATIONSHIPS.map(r => (
                                    <Toggle.Item key={r.value} name={r.value} label={r.label}>
                                        <Toggle.RadioWithLabel
                                            label={r.label}
                                            selected={selectedRel === r.value}
                                        />
                                    </Toggle.Item>
                                ))}
                            </View>
                        </Toggle.Group>
                    </View>
                </>
            )}

            <View style={[a.flex_row, a.align_center, a.gap_md]}>
                <Button
                    label={l`Save changes`}
                    onPress={onSave}
                    color="primary"
                    size="medium"
                    disabled={!canToggle || updateProfile.isPending}>
                    <ButtonText>
                        {updateProfile.isPending ? <Trans>Saving...</Trans> : <Trans>Save Changes</Trans>}
                    </ButtonText>
                </Button>

                {isSaved && (
                    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                        <Trans>Saved successfully!</Trans>
                    </Text>
                )}
            </View>
        </View>
    )
}
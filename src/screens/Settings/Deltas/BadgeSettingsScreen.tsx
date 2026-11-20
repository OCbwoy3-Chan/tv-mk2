import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { type $Typed } from '@atproto/lex'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQueryClient } from '@tanstack/react-query'

import {
  getKinBadge,
  isKinBadge,
  KIN_BADGES,
  KIN_BADGE_TYPES,
  type KinBadgeToplevel,
} from '#/deltas/feat/kinBadges'
import { RQKEY_ROOT as POST_FEED_RQKEY_ROOT } from '#/state/queries/post-feed'
import {
  useProfileQuery,
  useProfileUpdateMutation,
} from '#/state/queries/profile'
import { postThreadQueryKeyRoot } from '#/state/queries/usePostThread/types'
import { useSession } from '#/state/session'
import { atoms as a, useTheme } from '#/alf'
import { Button, ButtonText } from '#/components/Button'
import * as Toast from '#/components/Toast'
import { Text } from '#/components/Typography'
import { com } from '#/lexicons'
import * as bsky from '#/types/bsky'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { RunesScreenLayout } from '../RunesSettings/components/RunesScreenLayout'
import * as Admonition from '#/components/Admonition'
import { Logomark } from '#/view/icons/Logomark'
import * as Toggle from '#/components/forms/Toggle'
import * as Select from '#/components/Select'

export function DeltasBadgeSettingsScreen() {
  const { t: l } = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()
  const { currentAccount } = useSession()
  const { data: profile } = useProfileQuery({ did: currentAccount?.did })
  const updateProfile = useProfileUpdateMutation()
  const [enabled, setEnabled] = useState(false)
  const [groupId, setGroupId] = useState(KIN_BADGES[0].id)
  const [badgeId, setBadgeId] = useState(KIN_BADGES[0].badges[0].id)
  const [kinId, setKinId] = useState(KIN_BADGE_TYPES[0].id)
  const [saved, setSaved] = useState(false)
  const [savedValue, setSavedValue] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    const badge = getKinBadge(profile)
    setSavedValue(badge.has ? `${badge.id}-${badge.badge}-${badge.kin}` : null)
    setEnabled(badge.has)
    if (badge.has) {
      setGroupId(badge.id)
      setBadgeId(badge.badge)
      setKinId(badge.kin)
    }
  }, [profile])

  const group = KIN_BADGES.find(item => item.id === groupId)
  const value = enabled
    ? `${groupId}-${badgeId}-${group?.kinsEnabled ? kinId : 'badge'}`
    : null
  const hasChanges = value !== savedValue

  const onSave = () => {
    if (!profile) return
    setSaved(false)
    updateProfile.mutate(
      {
        profile,
        updates: existing => {
          const labels: $Typed<com.atproto.label.defs.SelfLabels> =
            bsky.matches(com.atproto.label.defs.selfLabels, existing.labels)
              ? existing.labels
              : { $type: 'com.atproto.label.defs#selfLabels', values: [] }
          labels.values = labels.values.filter(label => !isKinBadge(label))
          if (value) labels.values.push({ val: value })
          if (labels.values.length) existing.labels = labels
          else delete existing.labels
          return existing
        },
        checkCommitted: result => {
          if (!result) return false
          const badges =
            result.labels?.filter(
              label =>
                label.src === result.did &&
                label.uri ===
                `at://${result.did}/app.bsky.actor.profile/self` &&
                isKinBadge(label),
            ) ?? []
          return enabled
            ? badges.length === 1 && badges[0].val === value
            : badges.length === 0
        },
      },
      {
        onSuccess() {
          void queryClient.invalidateQueries({ queryKey: [POST_FEED_RQKEY_ROOT] })
          void queryClient.invalidateQueries({
            queryKey: [postThreadQueryKeyRoot],
          })
          setSavedValue(value)
          setSaved(true)
        },
        onError() {
          Toast.show(l`Could not save badge settings. Please try again.`, {
            type: 'error',
          })
        },
      },
    )
  }

  return (
    <RunesScreenLayout titleText={l`Badge settings`}>
      <SettingsList.Item>
        <View style={[a.gap_sm, a.w_full]}>
          <View style={[a.flex_row, a.gap_sm]}>
            <Logomark width={24} />
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Badge</Trans>
            </Text>
          </View>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              Show a character badge on your profile. A tenna.party exclusive rn
              👀
            </Trans>
          </Text>
        </View>
      </SettingsList.Item>

      <SettingsList.Item>
        <Toggle.Item
          name="kin_badge_enabled"
          value={enabled}
          disabled={!profile || updateProfile.isPending}
          onChange={value => {
            setEnabled(value)
            setSaved(false)
          }}
          label={l`Enable badge`}>
          <Toggle.LabelText style={[a.flex_1, t.atoms.text, a.text_md, a.font_normal]}>
            <Trans>Enable badge:</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
      </SettingsList.Item>

      {enabled && (
        <>
          <VerseSelector
            value={groupId}
            disabled={updateProfile.isPending}
            onChange={group => {
              setGroupId(group.id)
              setBadgeId(group.badges[0].id)
              setSaved(false)
            }}
          />
          <BadgeSelector
            groupId={groupId}
            value={badgeId}
            disabled={updateProfile.isPending}
            onChange={value => {
              setBadgeId(value)
              setSaved(false)
            }}
          />
          {group?.kinsEnabled && (
            <>
              <KinSelector
                value={kinId}
                disabled={updateProfile.isPending}
                onChange={value => {
                  setKinId(value)
                  setSaved(false)
                }}
              />
              <SettingsList.Item>
                <Admonition.Outer type="tip" style={a.flex_1}>
                  <Admonition.Row>
                    <Admonition.Icon />
                    <Admonition.Content>
                      <Text>
                        <Trans>Here's a brief guide to the kin options:</Trans>
                      </Text>
                      <Text>
                        <Trans>- Fictive: You identify as the character.</Trans>
                      </Text>
                      <Text>
                        <Trans>
                          - Fictionkin: You identify as the character on a more
                          personal level.
                        </Trans>
                      </Text>
                      <Text>
                        <Trans>
                          - Otherkin: Basically Therian for fictional species.
                        </Trans>
                      </Text>
                      <Text style={[a.mt_lg]}>
                        <Trans>
                          These descriptions are a starting point; people may use
                          these terms differently.
                        </Trans>
                      </Text>
                    </Admonition.Content>
                  </Admonition.Row>
                </Admonition.Outer>
              </SettingsList.Item>
            </>
          )}
        </>
      )}
      <SettingsList.Item>
        <View style={[a.flex_1, a.gap_md]}>
          <View style={[a.flex_row, a.align_center, a.gap_md]}>
            <Button
              label={l`Save changes`}
              onPress={onSave}
              color="primary"
              size="medium"
              disabled={!profile || updateProfile.isPending || !hasChanges}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
            {saved && (
              <Text style={t.atoms.text_contrast_medium}>
                <Trans>Saved!</Trans>
              </Text>
            )}
          </View>
        </View>
      </SettingsList.Item>
    </RunesScreenLayout>
  )
}

function VerseSelector({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled: boolean
  onChange: (group: KinBadgeToplevel) => void
}) {
  const { t: l } = useLingui()
  const items = KIN_BADGES.map(group => ({ value: group.id, label: group.group }))
  return (
    <SettingsList.Item>
      <SettingsList.ItemText>
        <Trans>Choose 'verse:</Trans>
      </SettingsList.ItemText>
      <View style={a.flex_1}>
        <Select.Root
          value={value}
          disabled={disabled}
          onValueChange={id => {
            const group = KIN_BADGES.find(item => item.id === id)
            if (group) onChange(group)
          }}>
          <Select.Trigger label={l`Choose 'verse`}>
            <Select.ValueText />
            <Select.Icon />
          </Select.Trigger>
          <Select.Content
            label={l`Choose 'verse`}
            items={items}
            renderItem={({ label, value: id }) => (
              <Select.Item value={id} label={label}>
                <Select.ItemIndicator />
                <Select.ItemText>{label}</Select.ItemText>
              </Select.Item>
            )}
          />
        </Select.Root>
      </View>
    </SettingsList.Item>
  )
}

function BadgeSelector({
  groupId,
  value,
  disabled,
  onChange,
}: {
  groupId: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t: l } = useLingui()
  const items =
    KIN_BADGES.find(group => group.id === groupId)?.badges.map(badge => ({
      value: badge.id,
      label: badge.name,
    })) ?? []
  return (
    <SettingsList.Item>
      <SettingsList.ItemText>
        <Trans>Badge:</Trans>
      </SettingsList.ItemText>
      <View style={a.flex_1}>
        <Select.Root value={value} disabled={disabled} onValueChange={onChange}>
          <Select.Trigger label={l`Choose badge`}>
            <Select.ValueText />
            <Select.Icon />
          </Select.Trigger>
          <Select.Content
            label={l`Choose badge`}
            items={items}
            renderItem={({ label, value: id }) => (
              <Select.Item value={id} label={label}>
                <Select.ItemIndicator />
                <Select.ItemText>{label}</Select.ItemText>
              </Select.Item>
            )}
          />
        </Select.Root>
      </View>
    </SettingsList.Item>
  )
}

function KinSelector({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t: l } = useLingui()
  const items = KIN_BADGE_TYPES.map(kin => ({ value: kin.id, label: kin.name }))
  return (
    <SettingsList.Item>
      <SettingsList.ItemText>
        <Trans>Kin:</Trans>
      </SettingsList.ItemText>
      <View style={a.flex_1}>
        <Select.Root value={value} disabled={disabled} onValueChange={onChange}>
          <Select.Trigger label={l`Choose kin`}>
            <Select.ValueText />
            <Select.Icon />
          </Select.Trigger>
          <Select.Content
            label={l`Choose kin`}
            items={items}
            renderItem={({ label, value: id }) => (
              <Select.Item value={id} label={label}>
                <Select.ItemIndicator />
                <Select.ItemText>{label}</Select.ItemText>
              </Select.Item>
            )}
          />
        </Select.Root>
      </View>
    </SettingsList.Item>
  )
}

import {type $Typed, ComAtprotoLabelDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {RQKEY_ROOT as POST_FEED_RQKEY_ROOT} from '#/state/queries/post-feed'
import {
  useProfileQuery,
  useProfileUpdateMutation,
} from '#/state/queries/profile'
import {postThreadQueryKeyRoot} from '#/state/queries/usePostThread/types'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'

export function CustomLabelToggle({
  label,
  isChild,
  value,
}: {
  label?: string
  isChild?: boolean
  value: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const updateProfile = useProfileUpdateMutation()

  const isLabeled =
    profile?.labels?.some(l => l.val === value && l.src === profile.did) ??
    false
  const canToggle = profile && !updateProfile.isPending

  const onToggle = () => {
    if (!profile) {
      return
    }
    let wasAdded = false
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

          const hasLabel = labels.values.some(l => l.val === value)
          if (hasLabel) {
            wasAdded = false
            labels.values = labels.values.filter(l => l.val !== value)
          } else {
            wasAdded = true
            labels.values.push({val: value})
          }

          if (labels.values.length === 0) {
            delete existing.labels
          } else {
            existing.labels = labels
          }

          return existing
        },
        checkCommitted: res => {
          const exists = !!res.data.labels?.some(l => l.val === value)
          return exists === wasAdded
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({queryKey: [POST_FEED_RQKEY_ROOT]})
          queryClient.invalidateQueries({queryKey: [postThreadQueryKeyRoot]})
        },
      },
    )
  }

  return (
    <Toggle.Item
      name="automation_label"
      disabled={!canToggle || updateProfile.isPending}
      value={isLabeled}
      onChange={onToggle}
      label={l`Toggle ${label} label`}
      style={
        !isChild && [
          a.w_full,
          a.p_md,
          a.rounded_lg,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg_contrast_50,
        ]
      }>
      <Toggle.LabelText style={[a.flex_1, a.text_md, a.font_medium]}>
        <Text style={[a.flex_1, a.text_md, a.font_medium]}>
          {label ?? value}
        </Text>
      </Toggle.LabelText>
      <Toggle.Platform />
    </Toggle.Item>
  )
}
import { type Insets } from 'react-native'

import { useSession } from '#/state/session'
import { getKinBadge, KIN_BADGE_TYPES, KIN_BADGES } from '#/deltas/feat/kinBadges'
import { type AnyProfileView } from '#/types/bsky/profile'
import { ProfileBadge } from './vip'

export function KinBadge({
  profile,
  width,
  interactive,
  hitSlop,
}: {
  profile: AnyProfileView
  width: number
  interactive: boolean
  hitSlop: Insets
}) {
  const { currentAccount } = useSession()
  const selected = getKinBadge(profile)
  const group = KIN_BADGES.find(item => item.id === selected.id)
  const badge = selected.has
    ? group?.badges.find(item => item.id === selected.badge)
    : undefined
  const kin = KIN_BADGE_TYPES.find(item => item.id === selected.kin)
  const isSelf = currentAccount?.did === profile.did
  const name = badge?.name ?? ''
  if (!badge?.img || !kin) return null
  const template =
    typeof kin.showAs === 'string'
      ? kin.showAs
      : isSelf
        ? kin.showAs?.you ?? kin.showAs?.others
        : kin.showAs?.others
  const description = (template ?? name).replace(
    /%[cas]/g,
    token => (token === '%a' ? (badge.article ?? 'a') : name),
  )

  return (
    <ProfileBadge
      source={badge.img}
      title={name}
      description={description}
      width={width}
      interactive={interactive}
      hitSlop={hitSlop}
      showSettings={isSelf}
    />
  )
}

import {View} from 'react-native'
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'

import {getAuthorPrimaryName} from '#/lib/strings/display-names'
import {type Shadow} from '#/state/cache/types'
import {useHideDisplayNames} from '#/state/preferences/hide-display-names'
import {atoms as a, platform, useBreakpoints, useTheme} from '#/alf'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'

export function ProfileHeaderDisplayName({
  profile,
  moderation,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const hideDisplayNames = useHideDisplayNames()

  return (
    <View>
      <Text
        emoji
        testID="profileHeaderDisplayName"
        style={[
          t.atoms.text,
          gtMobile ? a.text_4xl : a.text_3xl,
          a.self_start,
          a.font_bold,
          a.leading_tight,
        ]}>
        {getAuthorPrimaryName(profile, {
          hideDisplayNames,
          moderation: moderation.ui('displayName'),
        })}
        <View style={[a.pl_xs, {marginTop: platform({ios: 2})}]}>
          <ProfileBadges profile={profile} size="lg" interactive />
        </View>
      </Text>
    </View>
  )
}

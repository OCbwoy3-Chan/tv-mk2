import {View} from 'react-native'
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'

import {getAuthorPrimaryName} from '#/lib/strings/display-names'
import {type Shadow} from '#/state/cache/types'
import {useHideDisplayNames} from '#/state/preferences/hide-display-names'
import {atoms as a, platform, useBreakpoints, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {useProfileHandleLink} from './useProfileHandleLink'

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
  const shouldShowProfileLink = useProfileHandleLink(profile.handle)
  const primaryName = getAuthorPrimaryName(profile, {
    hideDisplayNames,
    moderation: moderation.ui('displayName'),
  })

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
        {hideDisplayNames && shouldShowProfileLink ? (
          <InlineLinkText
            to={`https://${profile.handle}`}
            label={profile.handle}
            disableMismatchWarning
            style={[
              gtMobile ? a.text_4xl : a.text_3xl,
              a.font_bold,
              a.leading_tight,
            ]}>
            {primaryName}
          </InlineLinkText>
        ) : (
          primaryName
        )}
        <View style={[a.pl_xs, {marginTop: platform({ios: 2})}]}>
          <ProfileBadges
            profile={profile}
            size="lg"
            interactive
            showBetaBadge
          />
        </View>
        {/*
         * TODO: Workaround for a rounding bug in Android RN.
         * Fixed upstream in RN main (facebook/react-native#56651); remove this
         *  once we are on a release that contains it (0.86.0 should be good).
         */}{' '}
      </Text>
    </View>
  )
}

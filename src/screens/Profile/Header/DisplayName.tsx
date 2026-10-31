import {View} from 'react-native'
import {type ModerationDecision} from '@bsky/sdk/moderation'

import {getAuthorPrimaryName} from '#/lib/strings/display-names'
import {type Shadow} from '#/state/cache/types'
import {useHideDisplayNames} from '#/state/preferences/hide-display-names'
import {atoms as a, platform, useBreakpoints, useTheme, web} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {GradientName, useNameStyle} from '#/features/avatarDecorations'
import {type app} from '#/lexicons'
import {useProfileHandleLink} from './useProfileHandleLink'

export function ProfileHeaderDisplayName({
  profile,
  moderation,
}: {
  profile: Shadow<app.bsky.actor.defs.ProfileViewDetailed>
  moderation: ModerationDecision
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const hideDisplayNames = useHideDisplayNames()
  const nameStyle = useNameStyle(profile.did)
  const decorationStyle =
    !hideDisplayNames && !moderation.ui('displayName').blur
      ? nameStyle
      : undefined
  const shouldShowProfileLink = useProfileHandleLink(profile.handle)
  const primaryName = getAuthorPrimaryName(profile, {
    hideDisplayNames,
    moderation: moderation.ui('displayName'),
  })

  return (
    <View>
      <View style={[a.flex_row, a.flex_wrap, a.align_center]}>
        {hideDisplayNames && shouldShowProfileLink ? (
          <InlineLinkText
            testID="profileHeaderDisplayName"
            to={`https://${profile.handle}`}
            label={profile.handle}
            disableMismatchWarning
            style={[
              a.flex_shrink,
              gtMobile ? a.text_4xl : a.text_3xl,
              a.font_bold,
              a.leading_tight,
            ]}>
            {primaryName}
          </InlineLinkText>
        ) : (
          <Text
            emoji
            testID="profileHeaderDisplayName"
            style={[
              a.flex_shrink,
              t.atoms.text,
              gtMobile ? a.text_4xl : a.text_3xl,
              a.font_bold,
              a.leading_tight,
              decorationStyle,
            ]}>
            <GradientName did={profile.did} enabled={!!decorationStyle}>
              {primaryName}
            </GradientName>
          </Text>
        )}
        <View
          style={[
            a.pl_xs,
            web({verticalAlign: 'middle', transform: [{translateY: -1}]}),
            {marginTop: platform({ios: 2})},
          ]}>
          <ProfileBadges
            profile={profile}
            size="lg"
            interactive
            showBetaBadge
          />
        </View>
      </View>
    </View>
  )
}

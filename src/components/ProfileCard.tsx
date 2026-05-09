import {useMemo} from 'react'
import {
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import Svg, {Defs, Mask, Path, Rect} from 'react-native-svg'
import {
  type AppBskyActorDefs,
  moderateProfile,
  type ModerationOpts,
  RichText as RichTextApi,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {getModerationCauseKey} from '#/lib/moderation'
import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useEnableSquareAvatars} from '#/state/preferences/enable-square-avatars'
import {useShowFollowsYouBadge} from '#/state/preferences/show-follows-you-badge'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {PreviewableUserAvatar, UserAvatar} from '#/view/com/util/UserAvatar'
import {
  atoms as a,
  platform,
  type TextStyleProp,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
} from '#/components/Button'
import {EphemeralAccountSwitcher} from '#/components/EphemeralAccountSwitcher'
import {
  Check_Stroke2_Corner0_Rounded as Check,
  DoubleCheck_Stroke2_Corner0_Rounded as DoubleCheck,
} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import * as Pills from '#/components/Pills'
import {ProfileBadges} from '#/components/ProfileBadges'
import {RichText} from '#/components/RichText'
import {
  useSelectionItem,
  useSelectionStyles,
} from '#/components/selection/SelectionScope'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {type Metrics} from '#/analytics'
import {useActorStatus} from '#/features/liveNow'
import type * as bsky from '#/types/bsky'
import {useEphemeralFollowAction} from './hooks/useEphemeralFollowAction'

export function Default({
  profile: profileUnshadowed,
  moderationOpts,
  logContext = 'ProfileCard',
  testID,
  position,
  contextProfileDid,
  onPress,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
  testID?: string
  position?: number
  contextProfileDid?: string
  onPress?: (e: GestureResponderEvent) => void
}) {
  const profileShadowed = useProfileShadow(profileUnshadowed)
  const selection = useSelectionItem(
    profileShadowed as unknown as AppBskyActorDefs.ProfileViewBasic,
    'profiles',
  )
  const selectionStyles = useSelectionStyles()

  return (
    <Link
      testID={testID}
      profile={profileUnshadowed}
      style={[
        a.flex_col,
        a.w_full,
        selection.selected && selectionStyles ? selectionStyles.row : undefined,
      ]}
      onPress={e => {
        if (selection.selectionActive) {
          selection.onSelect()
          return false
        }
        return onPress?.(e)
      }}
      onLongPress={() => {
        selection.onEnterSelection()
      }}>
      <View
        pointerEvents={selection.selectionActive ? 'none' : 'auto'}
        style={[a.w_full, a.overflow_hidden]}>
        <Card
          profile={profileUnshadowed}
          moderationOpts={moderationOpts}
          logContext={logContext}
          position={position}
          contextProfileDid={contextProfileDid}
          selectionActive={selection.selectionActive}
          onSelect={selection.onSelect}
          onEnterSelection={selection.onEnterSelection}
          selected={selection.selected}
          selectionStyles={selectionStyles}
        />
      </View>
    </Link>
  )
}

export function Card({
  profile,
  moderationOpts,
  logContext = 'ProfileCard',
  position,
  contextProfileDid,
  selectionActive,
  onSelect,
  onEnterSelection,
  selected,
  selectionStyles,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
  position?: number
  contextProfileDid?: string
  selectionActive?: boolean
  onSelect?: () => void
  onEnterSelection?: () => void
  selected?: boolean
  selectionStyles?: ReturnType<typeof useSelectionStyles>
}) {
  return (
    <Outer>
      <Header>
        <Avatar
          profile={profile}
          moderationOpts={moderationOpts}
          onPress={selectionActive ? onSelect : undefined}
          onLongPress={onEnterSelection}
          disableNavigation={selectionActive}
          selected={selected}
          selectionStyles={selectionStyles}
        />
        <NameAndHandle profile={profile} moderationOpts={moderationOpts} />
        <FollowButton
          profile={profile}
          moderationOpts={moderationOpts}
          logContext={logContext}
          position={position}
          contextProfileDid={contextProfileDid}
        />
      </Header>

      <Labels profile={profile} moderationOpts={moderationOpts} />

      <Description profile={profile} />
    </Outer>
  )
}

export function Outer({
  children,
  style,
}: {
  children: React.ReactNode | React.ReactNode[]
  style?: ViewStyleProp
}) {
  return (
    <View
      style={[
        a.w_full,
        a.flex_1,
        a.gap_xs,
        style,
      ]}>
      {children}
    </View>
  )
}

export function Header({
  children,
}: {
  children: React.ReactNode | React.ReactNode[]
}) {
  return <View style={[a.flex_row, a.align_center, a.gap_sm]}>{children}</View>
}

export function Link({
  profile,
  children,
  style,
  ...rest
}: {
  profile: bsky.profile.AnyProfileView
} & Omit<LinkProps, 'to' | 'label'>) {
  const {t: l} = useLingui()

  const profileURL = makeProfileLink({
    did: profile.did,
    handle: profile.handle,
  })

  return (
    <InternalLink
      testID={`profileCard-${profile.handle}-link`}
      label={l`View ${
        profile.displayName || sanitizeHandle(profile.handle)
      }’s profile`}
      to={profileURL}
      style={[a.flex_col, style]}
      {...rest}>
      {children}
    </InternalLink>
  )
}

export function Avatar({
  profile,
  moderationOpts,
  onPress,
  onLongPress,
  disabledPreview,
  disableNavigation,
  liveOverride,
  size = 40,
  selected,
  selectionStyles,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  onPress?: () => void
  onLongPress?: () => void
  disabledPreview?: boolean
  disableNavigation?: boolean
  liveOverride?: boolean
  size?: number
  selected?: boolean
  selectionStyles?: ReturnType<typeof useSelectionStyles>
}) {
  const moderation = moderateProfile(profile, moderationOpts)
  const enableSquareAvatars = useEnableSquareAvatars()

  const {isActive: live} = useActorStatus(profile)

  return (
    <View style={[a.relative]}>
      {disabledPreview ? (
        <UserAvatar
          size={size}
          avatar={profile.avatar}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
          moderation={moderation.ui('avatar')}
          live={liveOverride ?? live}
        />
      ) : (
        <PreviewableUserAvatar
          size={size}
          profile={profile}
          moderation={moderation.ui('avatar')}
          onBeforePress={onPress}
          onPress={disableNavigation ? onPress : undefined}
          onLongPress={onLongPress}
          disableNavigation={disableNavigation}
          live={liveOverride ?? live}
        />
      )}
      {selected && selectionStyles ? (
        <>
          <View
            pointerEvents="none"
            style={[
              a.absolute,
              {
                left: 0,
                top: 0,
                width: size,
                height: size,
                borderRadius: enableSquareAvatars ? 8 : 999,
                overflow: 'hidden',
              },
            ]}>
            <Svg width="100%" height="100%" viewBox="0 0 24 24">
              <Defs>
                <Mask id="selectedAviCutoutMask">
                  <Rect width="24" height="24" fill="white" />
                  <Path
                    d="M21.59 3.193a1 1 0 0 1 .217 1.397l-11.706 16a1 1 0 0 1-1.429.193l-6.294-5a1 1 0 1 1 1.244-1.566l5.48 4.353 11.09-15.16a1 1 0 0 1 1.398-.217Z"
                    fill="black"
                    transform="translate(3 3) scale(0.75)"
                  />
                </Mask>
              </Defs>
              <Rect
                width="24"
                height="24"
                fill={selectionStyles.avatarBadge.backgroundColor}
                mask="url(#selectedAviCutoutMask)"
              />
            </Svg>
          </View>
        </>
      ) : null}
    </View>
  )
}

export function AvatarPlaceholder({size = 40}: {size?: number}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_full,
        t.atoms.bg_contrast_50,
        {
          width: size,
          height: size,
        },
      ]}
    />
  )
}

export function NameAndHandle({
  profile,
  moderationOpts,
  inline = false,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  inline?: boolean
}) {
  if (inline) {
    return (
      <InlineNameAndHandle profile={profile} moderationOpts={moderationOpts} />
    )
  } else {
    return (
      <View style={[a.flex_1]}>
        <Name profile={profile} moderationOpts={moderationOpts} />
        <Handle profile={profile} />
      </View>
    )
  }
}

function InlineNameAndHandle({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const handle = sanitizeHandle(profile.handle, '@')
  return (
    <View style={[a.flex_row, a.align_end, a.flex_shrink]}>
      <Text
        emoji
        style={[
          a.font_semi_bold,
          a.leading_tight,
          a.flex_shrink_0,
          {maxWidth: '70%'},
        ]}
        numberOfLines={1}>
        {forceLTR(name)}
      </Text>
      <View
        style={[
          a.pl_2xs,
          a.self_center,
          {marginTop: platform({default: 0, android: -1})},
        ]}>
        <ProfileBadges profile={profile} size="sm" />
      </View>
      <Text
        emoji
        style={[
          a.leading_tight,
          t.atoms.text_contrast_medium,
          {flexShrink: 10},
        ]}
        numberOfLines={1}>
        {NON_BREAKING_SPACE + handle}
      </Text>
    </View>
  )
}

export function Name({
  profile,
  moderationOpts,
  style,
  textStyle,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}) {
  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  return (
    <View style={[a.flex_row, a.align_center, a.max_w_full, style]}>
      <Text
        emoji
        style={[
          a.text_md,
          a.font_semi_bold,
          a.leading_snug,
          a.self_start,
          a.flex_shrink,
          textStyle,
        ]}
        numberOfLines={1}>
        {name}
      </Text>
      <ProfileBadges profile={profile} size="md" style={[a.pl_xs]} />
    </View>
  )
}

export function Handle({
  profile,
  textStyle,
}: {
  profile: bsky.profile.AnyProfileView
  textStyle?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const handle = sanitizeHandle(profile.handle, '@')

  return (
    <Text
      emoji
      style={[a.leading_snug, t.atoms.text_contrast_medium, textStyle]}
      numberOfLines={1}>
      {handle}
    </Text>
  )
}

export function NameAndHandlePlaceholder() {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.gap_xs]}>
      <View
        style={[
          a.rounded_xs,
          t.atoms.bg_contrast_50,
          {
            width: '60%',
            height: 14,
          },
        ]}
      />

      <View
        style={[
          a.rounded_xs,
          t.atoms.bg_contrast_50,
          {
            width: '40%',
            height: 10,
          },
        ]}
      />
    </View>
  )
}

export function NamePlaceholder({style}: ViewStyleProp) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_xs,
        t.atoms.bg_contrast_50,
        {
          width: '60%',
          height: 14,
        },
        style,
      ]}
    />
  )
}

export function Description({
  profile: profileUnshadowed,
  numberOfLines = 3,
  style,
}: {
  profile: bsky.profile.AnyProfileView
  numberOfLines?: number
} & TextStyleProp) {
  const profile = useProfileShadow(profileUnshadowed)
  const rt = useMemo(() => {
    if (!('description' in profile)) return
    const rt = new RichTextApi({text: profile.description || ''})
    rt.detectFacetsWithoutResolution()
    return rt
  }, [profile])
  if (!rt) return null
  if (
    profile.viewer &&
    (profile.viewer.blockedBy ||
      profile.viewer.blocking ||
      profile.viewer.blockingByList)
  )
    return null
  return (
    <View style={[a.pt_xs]}>
      <RichText
        value={rt}
        style={style}
        numberOfLines={numberOfLines}
        disableLinks
      />
    </View>
  )
}

export function DescriptionPlaceholder({
  numberOfLines = 3,
}: {
  numberOfLines?: number
}) {
  const t = useTheme()
  return (
    <View style={[a.pt_2xs, {gap: 6}]}>
      {Array(numberOfLines)
        .fill(0)
        .map((_, i) => (
          <View
            key={i}
            style={[
              a.rounded_xs,
              a.w_full,
              t.atoms.bg_contrast_50,
              {height: 12, width: i + 1 === numberOfLines ? '60%' : '100%'},
            ]}
          />
        ))}
    </View>
  )
}

export type FollowButtonProps = {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  logContext: Metrics['profile:follow']['logContext'] &
    Metrics['profile:unfollow']['logContext']
  colorInverted?: boolean
  onFollow?: () => void
  withIcon?: boolean
  position?: number
  contextProfileDid?: string
} & Partial<ButtonProps>

export function FollowButton(props: FollowButtonProps) {
  const {currentAccount, hasSession} = useSession()
  const isMe = props.profile.did === currentAccount?.did
  return hasSession && !isMe ? <FollowButtonInner {...props} /> : null
}

export function FollowButtonInner({
  profile: profileUnshadowed,
  moderationOpts,
  logContext,
  onPress: onPressProp,
  onFollow,
  colorInverted,
  withIcon = true,
  position,
  contextProfileDid,
  ...rest
}: FollowButtonProps) {
  const {currentAccount, accounts} = useSession()
  const {t: l} = useLingui()
  const profile = useProfileShadow(profileUnshadowed)
  const moderation = moderateProfile(profile, moderationOpts)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
    position,
    contextProfileDid,
  )
  const isRound = Boolean(rest.shape && rest.shape === 'round')
  const onSelectEphemeralAccount = useEphemeralFollowAction({
    profile,
    logContext,
    onFollow,
  })
  const hasAlternateAccounts = accounts.some(
    account => account.did !== currentAccount?.did,
  )

  const onPressFollow = async (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await queueFollow()
      Toast.show(
        l`Following ${sanitizeDisplayName(
          profile.displayName || profile.handle,
          moderation.ui('displayName'),
        )}`,
      )
      onPressProp?.(e)
      onFollow?.()
    } catch (e) {
      const err = e as Error
      if (err?.name !== 'AbortError') {
        Toast.show(l`An issue occurred, please try again.`, {
          type: 'error',
        })
      }
    }
  }

  const onPressUnfollow = async (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await queueUnfollow()
      Toast.show(
        l`No longer following ${sanitizeDisplayName(
          profile.displayName || profile.handle,
          moderation.ui('displayName'),
        )}`,
      )
      onPressProp?.(e)
    } catch (e) {
      const err = e as Error
      if (err?.name !== 'AbortError') {
        Toast.show(l`An issue occurred, please try again.`, {
          type: 'error',
        })
      }
    }
  }

  const unfollowLabel = profile.viewer?.followedBy
    ? l({
        message: 'Mutuals',
        comment: 'User is following this account, click to unfollow',
      })
    : l({
        message: 'Following',
        comment: 'User is following this account, click to unfollow',
      })
  const followLabel = profile.viewer?.followedBy
    ? l({
        message: 'Follow back',
        comment: 'User is not following this account, click to follow back',
      })
    : l({
        message: 'Follow',
        comment: 'User is not following this account, click to follow',
      })

  if (!profile.viewer) return null
  if (
    profile.viewer.blockedBy ||
    profile.viewer.blocking ||
    profile.viewer.blockingByList
  )
    return null
  const viewer = profile.viewer

  const renderFollowButton = (onLongPress?: () => void) =>
    viewer.following ? (
      <Button
        label={unfollowLabel}
        size="small"
        variant="solid"
        color="secondary"
        {...rest}
        onLongPress={onLongPress}
        onPress={(e: GestureResponderEvent) => {
          void onPressUnfollow(e)
        }}>
        {withIcon && (
          <ButtonIcon
            icon={viewer.followedBy ? DoubleCheck : Check}
            position={isRound ? undefined : 'left'}
          />
        )}
        {isRound ? null : <ButtonText>{unfollowLabel}</ButtonText>}
      </Button>
    ) : (
      <Button
        label={followLabel}
        size="small"
        variant="solid"
        color={colorInverted ? 'secondary_inverted' : 'primary'}
        {...rest}
        onLongPress={onLongPress}
        onPress={(e: GestureResponderEvent) => {
          void onPressFollow(e)
        }}>
        {withIcon && (
          <ButtonIcon icon={Plus} position={isRound ? undefined : 'left'} />
        )}
        {isRound ? null : <ButtonText>{followLabel}</ButtonText>}
      </Button>
    )

  return (
    <View>
      {currentAccount && hasAlternateAccounts ? (
        <EphemeralAccountSwitcher
          selectedDid={currentAccount.did}
          title={l`Follow as`}
          triggerBehavior="longPress"
          onSelectAccount={account => {
            void onSelectEphemeralAccount(account)
          }}
          renderTrigger={({triggerProps}) =>
            renderFollowButton(triggerProps.onLongPress)
          }
        />
      ) : (
        renderFollowButton()
      )}
    </View>
  )
}

export function FollowButtonPlaceholder({style}: ViewStyleProp) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_sm,
        t.atoms.bg_contrast_50,
        a.w_full,
        {
          height: 33,
        },
        style,
      ]}
    />
  )
}

export function Labels({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const moderation = moderateProfile(profile, moderationOpts)
  const modui = moderation.ui('profileList')
  const followedBy = profile.viewer?.followedBy
  const showFollowsYouBadge = useShowFollowsYouBadge()

  if (!(followedBy && showFollowsYouBadge) && !modui.inform && !modui.alert) {
    return null
  }

  return (
    <Pills.Row style={[a.pt_xs]}>
      {followedBy && showFollowsYouBadge && <Pills.FollowsYou />}
      {modui.alerts.map(alert => (
        <Pills.Label key={getModerationCauseKey(alert)} cause={alert} />
      ))}
      {modui.informs.map(inform => (
        <Pills.Label key={getModerationCauseKey(inform)} cause={inform} />
      ))}
    </Pills.Row>
  )
}

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type AppBskyActorDefs, type AppBskyFeedDefs} from '@atproto/api'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {type NavigationAction, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {cleanError} from '#/lib/strings/errors'
import {updatePostShadow} from '#/state/cache/post-shadow'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useDisableTopOfFeedButton} from '#/state/preferences/disable-top-of-feed-button'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {useAgent, useRequireAuth, useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {atoms as a, useLayoutBreakpoints, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Bookmark} from '#/components/icons/Bookmark'
import {CircleBanSign_Stroke2_Corner0_Rounded as BanIcon} from '#/components/icons/CircleBanSign'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Menu_Stroke2_Corner0_Rounded as MenuIcon} from '#/components/icons/Menu'
import {
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon,
  PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {Repost_Stroke2_Corner0_Rounded as RepostIcon} from '#/components/icons/Repost'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as SpeakerIcon} from '#/components/icons/Speaker'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {SubtleHover} from '#/components/SubtleHover'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

type SelectionKind = 'posts' | 'profiles'
type SelectedPost = AppBskyFeedDefs.PostView
type SelectedProfile = AppBskyActorDefs.ProfileViewBasic

type SelectedState = {
  posts: Map<string, SelectedPost>
  profiles: Map<string, SelectedProfile>
}

type SelectionContextValue = {
  kind: SelectionKind
  mode: boolean
  selectedCount: number
  isSelected: (id: string) => boolean
  enterSelection: (
    item: SelectedPost | SelectedProfile,
    kind: SelectionKind,
  ) => void
  toggleSelection: (
    item: SelectedPost | SelectedProfile,
    kind: SelectionKind,
  ) => void
  syncSelectedItem: (
    item: SelectedPost | SelectedProfile,
    kind: SelectionKind,
  ) => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

function getItemId(item: SelectedPost | SelectedProfile, itemKind: SelectionKind) {
  return itemKind === 'posts'
    ? (item as SelectedPost).uri
    : (item as SelectedProfile).did
}

function selectedPostDataMatches(
  stored: SelectedPost,
  incoming: SelectedPost,
): boolean {
  return (
    stored.uri === incoming.uri &&
    stored.cid === incoming.cid &&
    stored.viewer?.like === incoming.viewer?.like &&
    stored.viewer?.repost === incoming.viewer?.repost &&
    stored.viewer?.bookmarked === incoming.viewer?.bookmarked &&
    stored.viewer?.threadMuted === incoming.viewer?.threadMuted &&
    stored.viewer?.replyDisabled === incoming.viewer?.replyDisabled &&
    stored.viewer?.embeddingDisabled === incoming.viewer?.embeddingDisabled &&
    stored.viewer?.pinned === incoming.viewer?.pinned
  )
}

function selectedProfileDataMatches(
  stored: SelectedProfile,
  incoming: SelectedProfile,
): boolean {
  return (
    stored.did === incoming.did &&
    stored.viewer?.following === incoming.viewer?.following &&
    stored.viewer?.followedBy === incoming.viewer?.followedBy &&
    stored.viewer?.muted === incoming.viewer?.muted &&
    stored.viewer?.blocking === incoming.viewer?.blocking
  )
}

function isAtProtoRecordUri(value: string | undefined): boolean {
  return typeof value === 'string' && value.startsWith('at://')
}

/**
 * Feed rows often pass a post whose `viewer` lags behind `updatePostShadow` /
 * bulk selection updates. Merge so we do not drop real record URIs when the
 * incoming item still has empty viewer fields.
 */
function mergePostForSelectionSync(
  existing: SelectedPost,
  incoming: SelectedPost,
): SelectedPost {
  const exV = existing.viewer
  const inV = incoming.viewer
  const pickUri = (
    incomingVal: string | undefined,
    existingVal: string | undefined,
  ) => {
    if (incomingVal !== undefined && incomingVal !== '') {
      return incomingVal
    }
    if (isAtProtoRecordUri(existingVal)) {
      return existingVal
    }
    return incomingVal
  }
  return {
    ...incoming,
    viewer: {
      ...exV,
      ...inV,
      like: pickUri(inV?.like, exV?.like),
      repost: pickUri(inV?.repost, exV?.repost),
      bookmarked:
        inV?.bookmarked !== undefined ? inV.bookmarked : exV?.bookmarked,
      threadMuted:
        inV?.threadMuted !== undefined ? inV.threadMuted : exV?.threadMuted,
      replyDisabled:
        inV?.replyDisabled !== undefined
          ? inV.replyDisabled
          : exV?.replyDisabled,
      embeddingDisabled:
        inV?.embeddingDisabled !== undefined
          ? inV.embeddingDisabled
          : exV?.embeddingDisabled,
      pinned: inV?.pinned !== undefined ? inV.pinned : exV?.pinned,
    },
  }
}

function mergeProfileForSelectionSync(
  existing: SelectedProfile,
  incoming: SelectedProfile,
): SelectedProfile {
  const exV = existing.viewer
  const inV = incoming.viewer
  const pickUri = (
    incomingVal: string | undefined,
    existingVal: string | undefined,
  ) => {
    if (incomingVal !== undefined && incomingVal !== '') {
      return incomingVal
    }
    if (isAtProtoRecordUri(existingVal)) {
      return existingVal
    }
    return incomingVal
  }
  return {
    ...incoming,
    viewer: {
      ...exV,
      ...inV,
      following: pickUri(inV?.following, exV?.following),
      blocking: pickUri(inV?.blocking, exV?.blocking),
      followedBy: pickUri(inV?.followedBy, exV?.followedBy),
      muted: inV?.muted !== undefined ? inV.muted : exV?.muted,
      blockedBy: inV?.blockedBy !== undefined ? inV.blockedBy : exV?.blockedBy,
    },
  }
}

export function SelectionScope({
  kind,
  hasAdjacentFloatingButton = false,
  children,
}: {
  kind: SelectionKind
  hasAdjacentFloatingButton?: boolean
  children: ReactNode
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const requireAuth = useRequireAuth()
  const queryClient = useQueryClient()
  const navigation = useNavigation()
  const {currentAccount, hasSession} = useSession()
  const [mode, setMode] = useState(false)
  const [selected, setSelected] = useState<SelectedState>({
    posts: new Map(),
    profiles: new Map(),
  })
  const exitPrompt = Prompt.usePromptControl()
  const pendingActionRef = useRef<NavigationAction | null>(null)

  const selectedMap = kind === 'posts' ? selected.posts : selected.profiles
  const selectedCount = selectedMap.size

  const clearSelection = useCallback(() => {
    setSelected({posts: new Map(), profiles: new Map()})
    setMode(false)
  }, [])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!mode) return
      e.preventDefault()
      pendingActionRef.current = e.data.action
      exitPrompt.open()
    })
    return unsubscribe
  }, [exitPrompt, mode, navigation])

  const isSelected = useCallback(
    (id: string) => {
      return selectedMap.has(id)
    },
    [selectedMap],
  )

  const syncSelectedItem = useCallback(
    (item: SelectedPost | SelectedProfile, itemKind: SelectionKind) => {
      if (itemKind !== kind) return
      const id = getItemId(item, itemKind)
      setSelected(prev => {
        const map = itemKind === 'posts' ? prev.posts : prev.profiles
        if (!map.has(id)) return prev
        const existing = map.get(id)!
        if (itemKind === 'posts') {
          const merged = mergePostForSelectionSync(
            existing as SelectedPost,
            item as SelectedPost,
          )
          if (selectedPostDataMatches(existing as SelectedPost, merged)) {
            return prev
          }
          const nextMap = new Map(prev.posts)
          nextMap.set(id, merged)
          return {posts: nextMap, profiles: prev.profiles}
        }
        const mergedProfile = mergeProfileForSelectionSync(
          existing as SelectedProfile,
          item as SelectedProfile,
        )
        if (selectedProfileDataMatches(
          existing as SelectedProfile,
          mergedProfile,
        )) {
          return prev
        }
        const nextMap = new Map(prev.profiles)
        nextMap.set(id, mergedProfile)
        return {posts: prev.posts, profiles: nextMap}
      })
    },
    [kind],
  )

  const toggleSelection = useCallback(
    (item: SelectedPost | SelectedProfile, itemKind: SelectionKind) => {
      if (itemKind !== kind) return
      const id = getItemId(item, itemKind)
      if (itemKind === 'posts') {
        setSelected(prev => {
          const nextMap = new Map(prev.posts)
          if (nextMap.has(id)) {
            nextMap.delete(id)
          } else {
            nextMap.set(id, item as SelectedPost)
          }
          return {posts: nextMap, profiles: prev.profiles}
        })
      } else {
        setSelected(prev => {
          const nextMap = new Map(prev.profiles)
          if (nextMap.has(id)) {
            nextMap.delete(id)
          } else {
            nextMap.set(id, item as SelectedProfile)
          }
          return {posts: prev.posts, profiles: nextMap}
        })
      }
    },
    [kind],
  )

  const enterSelection = useCallback(
    (item: SelectedPost | SelectedProfile, itemKind: SelectionKind) => {
      if (itemKind !== kind) return
      setMode(true)
      const id = getItemId(item, itemKind)
      setSelected(prev => {
        if (itemKind === 'posts') {
          const nextMap = new Map(prev.posts)
          nextMap.set(id, item as SelectedPost)
          return {posts: nextMap, profiles: prev.profiles}
        }
        const nextMap = new Map(prev.profiles)
        nextMap.set(id, item as SelectedProfile)
        return {posts: prev.posts, profiles: nextMap}
      })
    },
    [kind],
  )

  const patchSelectedPosts = useCallback(
    (
      uris: string[],
      patch: (post: SelectedPost) => SelectedPost,
    ) => {
      setSelected(prev => {
        const nextPosts = new Map(prev.posts)
        for (const uri of uris) {
          const post = nextPosts.get(uri)
          if (post) {
            nextPosts.set(uri, patch(post))
          }
        }
        return {posts: nextPosts, profiles: prev.profiles}
      })
    },
    [],
  )

  const patchSelectedProfiles = useCallback(
    (
      dids: string[],
      patch: (profile: SelectedProfile) => SelectedProfile,
    ) => {
      setSelected(prev => {
        const nextProfiles = new Map(prev.profiles)
        for (const did of dids) {
          const profile = nextProfiles.get(did)
          if (profile) {
            nextProfiles.set(did, patch(profile))
          }
        }
        return {posts: prev.posts, profiles: nextProfiles}
      })
    },
    [],
  )

  const runPostAction = useCallback(
    async (
      label: string,
      filter: (post: SelectedPost) => boolean,
      apply: (post: SelectedPost) => Promise<SelectedPost>,
    ) => {
      const posts = [...selected.posts.values()].filter(filter)
      if (!posts.length) return
      try {
        const uriToNext = new Map<string, SelectedPost>()
        for (const post of posts) {
          const nextPost = await apply(post)
          uriToNext.set(post.uri, nextPost)
          updatePostShadow(queryClient, post.uri, {
            likeUri: nextPost.viewer?.like,
            repostUri: nextPost.viewer?.repost,
            bookmarked: nextPost.viewer?.bookmarked,
          })
        }
        patchSelectedPosts(posts.map(post => post.uri), post =>
          uriToNext.get(post.uri)!,
        )
        Toast.show(
          `${label} ${posts.length} post${posts.length === 1 ? '' : 's'}`,
          {type: 'success'},
        )
      } catch (e) {
        Toast.show(cleanError(e), {type: 'error'})
      }
    },
    [patchSelectedPosts, queryClient, selected.posts],
  )

  const runProfileAction = useCallback(
    async (
      label: string,
      filter: (profile: SelectedProfile) => boolean,
      apply: (profile: SelectedProfile) => Promise<SelectedProfile>,
      afterSuccess?: (profiles: SelectedProfile[]) => void,
    ) => {
      const profiles = [...selected.profiles.values()].filter(filter)
      if (!profiles.length) return
      try {
        const didToNext = new Map<string, SelectedProfile>()
        for (const profile of profiles) {
          const nextProfile = await apply(profile)
          didToNext.set(profile.did, nextProfile)
        }
        patchSelectedProfiles(
          profiles.map(profile => profile.did),
          profile => didToNext.get(profile.did)!,
        )
        afterSuccess?.(profiles)
        Toast.show(
          `${label} ${profiles.length} profile${
            profiles.length === 1 ? '' : 's'
          }`,
          {type: 'success'},
        )
      } catch (e) {
        Toast.show(cleanError(e), {type: 'error'})
      }
    },
    [patchSelectedProfiles, selected.profiles],
  )

  const actions = useMemo(() => {
    if (kind === 'posts') {
      return {
        like: () =>
          requireAuth(() =>
            runPostAction('Liked', post => !post.viewer?.like, async post => {
              const res = await agent.like(post.uri, post.cid)
              userActionHistory.like([post.uri])
              return {
                ...post,
                viewer: {...post.viewer, like: res.uri},
              }
            }),
          ),
        unlike: () =>
          requireAuth(() =>
            runPostAction(
              'Unliked',
              post => Boolean(post.viewer?.like),
              async post => {
                await agent.deleteLike(post.viewer!.like!)
                userActionHistory.unlike([post.uri])
                return {
                  ...post,
                  viewer: {...post.viewer, like: undefined},
                }
              },
            ),
          ),
        repost: () =>
          requireAuth(() =>
            runPostAction(
              'Reposted',
              post => !post.viewer?.repost,
              async post => {
                const res = await agent.repost(post.uri, post.cid)
                return {
                  ...post,
                  viewer: {...post.viewer, repost: res.uri},
                }
              },
            ),
          ),
        unrepost: () =>
          requireAuth(() =>
            runPostAction(
              'Removed repost from',
              post => Boolean(post.viewer?.repost),
              async post => {
                await agent.deleteRepost(post.viewer!.repost!)
                return {
                  ...post,
                  viewer: {...post.viewer, repost: undefined},
                }
              },
            ),
          ),
        bookmark: () =>
          requireAuth(() =>
            runPostAction(
              'Saved',
              post => !post.viewer?.bookmarked,
              async post => {
                await agent.app.bsky.bookmark.createBookmark({
                  uri: post.uri,
                  cid: post.cid,
                })
                return {
                  ...post,
                  viewer: {...post.viewer, bookmarked: true},
                }
              },
            ),
          ),
        unbookmark: () =>
          requireAuth(() =>
            runPostAction(
              'Removed',
              post => Boolean(post.viewer?.bookmarked),
              async post => {
                await agent.app.bsky.bookmark.deleteBookmark({
                  uri: post.uri,
                })
                return {
                  ...post,
                  viewer: {...post.viewer, bookmarked: false},
                }
              },
            ),
          ),
      }
    }

    return {
      follow: () =>
        requireAuth(() =>
          runProfileAction(
            'Followed',
            profile =>
              profile.did !== currentAccount?.did && !profile.viewer?.following,
            async profile => {
              const res = await agent.follow(profile.did)
              updateProfileShadow(queryClient, profile.did, {
                followingUri: res.uri,
              })
              return {
                ...profile,
                viewer: {...profile.viewer, following: res.uri},
              }
            },
            profiles => userActionHistory.follow(profiles.map(p => p.did)),
          ),
        ),
      unfollow: () =>
        requireAuth(() =>
          runProfileAction(
            'Unfollowed',
            profile => Boolean(profile.viewer?.following),
            async profile => {
              await agent.deleteFollow(profile.viewer!.following!)
              updateProfileShadow(queryClient, profile.did, {
                followingUri: undefined,
              })
              return {
                ...profile,
                viewer: {...profile.viewer, following: undefined},
              }
            },
            profiles => userActionHistory.unfollow(profiles.map(p => p.did)),
          ),
        ),
      mute: () =>
        requireAuth(() =>
          runProfileAction(
            'Muted',
            profile =>
              profile.did !== currentAccount?.did && !profile.viewer?.muted,
            async profile => {
              await agent.mute(profile.did)
              updateProfileShadow(queryClient, profile.did, {muted: true})
              return {
                ...profile,
                viewer: {...profile.viewer, muted: true},
              }
            },
          ),
        ),
      unmute: () =>
        requireAuth(() =>
          runProfileAction(
            'Unmuted',
            profile => Boolean(profile.viewer?.muted),
            async profile => {
              await agent.unmute(profile.did)
              updateProfileShadow(queryClient, profile.did, {muted: false})
              return {
                ...profile,
                viewer: {...profile.viewer, muted: false},
              }
            },
          ),
        ),
      block: () =>
        requireAuth(() =>
          runProfileAction(
            'Blocked',
            profile =>
              profile.did !== currentAccount?.did && !profile.viewer?.blocking,
            async profile => {
              if (!currentAccount) throw new Error('Not signed in')
              const res = await agent.app.bsky.graph.block.create(
                {repo: currentAccount.did},
                {
                  subject: profile.did,
                  createdAt: new Date().toISOString(),
                },
              )
              updateProfileShadow(queryClient, profile.did, {
                blockingUri: res.uri,
              })
              return {
                ...profile,
                viewer: {...profile.viewer, blocking: res.uri},
              }
            },
          ),
        ),
      unblock: () =>
        requireAuth(() =>
          runProfileAction(
            'Unblocked',
            profile => Boolean(profile.viewer?.blocking),
            async profile => {
              await agent.app.bsky.graph.block.delete({
                repo: currentAccount?.did ?? '',
                rkey: profile.viewer!.blocking!.split('/').pop()!,
              })
              updateProfileShadow(queryClient, profile.did, {
                blockingUri: undefined,
              })
              return {
                ...profile,
                viewer: {...profile.viewer, blocking: undefined},
              }
            },
          ),
        ),
    }
  }, [
    agent,
    currentAccount,
    kind,
    queryClient,
    requireAuth,
    runPostAction,
    runProfileAction,
  ])

  const contextValue = useMemo<SelectionContextValue>(
    () => ({
      kind,
      mode,
      selectedCount,
      isSelected,
      enterSelection,
      toggleSelection,
      syncSelectedItem,
    }),
    [
      enterSelection,
      isSelected,
      kind,
      mode,
      selectedCount,
      syncSelectedItem,
      toggleSelection,
    ],
  )

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
      {mode ? (
        <SelectionMenuButton
          kind={kind}
          count={selectedCount}
          hasSession={hasSession}
          hasAdjacentFloatingButton={hasAdjacentFloatingButton}
          clearSelection={clearSelection}
          actions={actions as unknown as Record<string, () => void>}
        />
      ) : null}
      <Prompt.Basic
        control={exitPrompt}
        title={_(msg`Are you sure?`)}
        description={_(msg`Exit selection mode? Your selections will be cleared.`)}
        confirmButtonCta={_(msg`Exit selection mode`)}
        onConfirm={() => {
          clearSelection()
          const action = pendingActionRef.current
          pendingActionRef.current = null
          if (action) {
            navigation.dispatch(action)
          }
        }}
      />
    </SelectionContext.Provider>
  )
}

function SelectionMenuButton({
  kind,
  count,
  hasSession,
  hasAdjacentFloatingButton,
  clearSelection,
  actions,
}: {
  kind: SelectionKind
  count: number
  hasSession: boolean
  hasAdjacentFloatingButton: boolean
  clearSelection: () => void
  actions: Record<string, () => void>
}) {
  const {_} = useLingui()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const {isDesktop, isTablet, isMobile, isTabletOrMobile} = useWebMediaQueries()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const disableTopOfFeedButton = useDisableTopOfFeedButton()
  const enableSquareButtons = useEnableSquareButtons()
  const {state: hovered, onIn: onHoverIn, onOut: onHoverOut} =
    useInteractionState()
  const isTallViewport = useMediaQuery({minHeight: 700})
  const showBottomBar = hasSession ? isMobile : isTabletOrMobile
  const baseBottom = isTablet ? 50 : clamp(insets.bottom, 15, 60) + 15
  const inlineStyle = isDesktop
    ? isTallViewport
      ? styles.loadLatestOutOfLine
      : styles.loadLatestInline
    : isTablet
      ? centerColumnOffset
        ? styles.loadLatestInlineOffset
        : styles.loadLatestInline
      : undefined
  const showAdjacentButton =
    hasAdjacentFloatingButton && !disableTopOfFeedButton
  const bottomPosition = {
    bottom: baseBottom + (showAdjacentButton ? 52 : 0),
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        label={_(
          msg`${plural(count, {one: '# item', other: '# items'})} selected`,
        )}>
        {triggerProps => (
          <Animated.View
            style={[
              a.fixed,
              a.z_20,
              {left: 18},
              inlineStyle,
              bottomPosition,
              showBottomBar && fabMinimalShellTransform,
            ]}>
            <PressableScale
              {...triggerProps.props}
              style={[
                styles.trigger,
                enableSquareButtons ? a.rounded_sm : a.rounded_full,
                t.atoms.bg,
                a.border,
                t.atoms.border_contrast_low,
              ]}
              hitSlop={HITSLOP_20}
              targetScale={0.9}
              onPointerEnter={() => {
                onHoverIn()
              }}
              onPointerLeave={() => {
                onHoverOut()
              }}>
              <SubtleHover
                hover={hovered}
                style={[enableSquareButtons ? a.rounded_sm : a.rounded_full]}
              />
              <MenuIcon
                size="md"
                style={[a.z_10, {color: t.palette.primary_500}]}
              />
              <View
                style={[
                  a.absolute,
                  a.align_center,
                  a.justify_center,
                  {
                    right: -4,
                    top: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    paddingHorizontal: 4,
                    backgroundColor: t.palette.primary_500,
                  },
                ]}>
                <Text
                  style={[a.text_xs, a.font_bold, a.text_center, {color: 'white'}]}>
                  {count}
                </Text>
              </View>
            </PressableScale>
          </Animated.View>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        {kind === 'posts' ? (
          <>
            <Menu.Item
              label={_(msg`Like selected posts`)}
              disabled={count === 0}
              onPress={actions.like}>
              <Menu.ItemText>{_(msg`Like selected posts`)}</Menu.ItemText>
              <Menu.ItemIcon icon={HeartIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Unlike selected posts`)}
              disabled={count === 0}
              onPress={actions.unlike}>
              <Menu.ItemText>{_(msg`Unlike selected posts`)}</Menu.ItemText>
              <Menu.ItemIcon icon={HeartIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Repost selected posts`)}
              disabled={count === 0}
              onPress={actions.repost}>
              <Menu.ItemText>{_(msg`Repost selected posts`)}</Menu.ItemText>
              <Menu.ItemIcon icon={RepostIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Remove repost from selected posts`)}
              disabled={count === 0}
              onPress={actions.unrepost}>
              <Menu.ItemText>
                {_(msg`Remove repost from selected posts`)}
              </Menu.ItemText>
              <Menu.ItemIcon icon={RepostIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Save selected posts`)}
              disabled={count === 0}
              onPress={actions.bookmark}>
              <Menu.ItemText>{_(msg`Save selected posts`)}</Menu.ItemText>
              <Menu.ItemIcon icon={Bookmark} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Remove selected posts from saved posts`)}
              disabled={count === 0}
              onPress={actions.unbookmark}>
              <Menu.ItemText>
                {_(msg`Remove selected posts from saved posts`)}
              </Menu.ItemText>
              <Menu.ItemIcon icon={Bookmark} />
            </Menu.Item>
          </>
        ) : (
          <>
            <Menu.Item
              label={_(msg`Follow selected profiles`)}
              disabled={count === 0}
              onPress={actions.follow}>
              <Menu.ItemText>{_(msg`Follow selected profiles`)}</Menu.ItemText>
              <Menu.ItemIcon icon={PersonPlusIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Unfollow selected profiles`)}
              disabled={count === 0}
              onPress={actions.unfollow}>
              <Menu.ItemText>{_(msg`Unfollow selected profiles`)}</Menu.ItemText>
              <Menu.ItemIcon icon={PersonCheckIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Mute selected profiles`)}
              disabled={count === 0}
              onPress={actions.mute}>
              <Menu.ItemText>{_(msg`Mute selected profiles`)}</Menu.ItemText>
              <Menu.ItemIcon icon={SpeakerIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Unmute selected profiles`)}
              disabled={count === 0}
              onPress={actions.unmute}>
              <Menu.ItemText>{_(msg`Unmute selected profiles`)}</Menu.ItemText>
              <Menu.ItemIcon icon={SpeakerIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Block selected profiles`)}
              disabled={count === 0}
              onPress={actions.block}>
              <Menu.ItemText>{_(msg`Block selected profiles`)}</Menu.ItemText>
              <Menu.ItemIcon icon={PersonXIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Unblock selected profiles`)}
              disabled={count === 0}
              onPress={actions.unblock}>
              <Menu.ItemText>{_(msg`Unblock selected profiles`)}</Menu.ItemText>
              <Menu.ItemIcon icon={BanIcon} />
            </Menu.Item>
          </>
        )}
        <Menu.Divider />
        <Menu.Item
          label={_(msg`Deselect everything`)}
          onPress={clearSelection}>
          <Menu.ItemText>{_(msg`Deselect everything`)}</Menu.ItemText>
          <Menu.ItemIcon icon={MenuIcon} />
        </Menu.Item>
      </Menu.Outer>
    </Menu.Root>
  )
}

export function useSelectionItem<T extends SelectedPost | SelectedProfile>(
  item: T,
  kind: SelectionKind,
) {
  const context = useContext(SelectionContext)
  const id = getItemId(item, kind)
  const selected = context?.kind === kind ? context.isSelected(id) : false
  const selectionActive = Boolean(context?.mode && context.kind === kind)
  const [optimisticSelected, setOptimisticSelected] = useState<
    boolean | undefined
  >(undefined)
  const optimisticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedImmediate =
    selectionActive && optimisticSelected !== undefined
      ? optimisticSelected
      : selected

  useEffect(() => {
    if (!selected || !context) return
    context.syncSelectedItem(item, kind)
  }, [context, item, kind, selected])

  useEffect(() => {
    return () => {
      if (optimisticTimeoutRef.current) {
        clearTimeout(optimisticTimeoutRef.current)
      }
    }
  }, [])

  const onSelect = useCallback(() => {
    if (selectionActive) {
      const next = !(optimisticSelected ?? selected)
      setOptimisticSelected(next)
      if (optimisticTimeoutRef.current) {
        clearTimeout(optimisticTimeoutRef.current)
      }
      optimisticTimeoutRef.current = setTimeout(() => {
        setOptimisticSelected(undefined)
      }, 250)
    }
    context?.toggleSelection(item, kind)
  }, [context, item, kind, optimisticSelected, selected, selectionActive])

  const onEnterSelection = useCallback(() => {
    setOptimisticSelected(true)
    if (optimisticTimeoutRef.current) {
      clearTimeout(optimisticTimeoutRef.current)
    }
    optimisticTimeoutRef.current = setTimeout(() => {
      setOptimisticSelected(undefined)
    }, 250)
    context?.enterSelection(item, kind)
  }, [context, item, kind])

  return {
    selectionActive,
    selected: selectedImmediate,
    onSelect,
    onEnterSelection,
  }
}

export function useSelectionStyles() {
  const t = useTheme()
  return useMemo(
    () => ({
      row: [
        {
          backgroundColor: t.palette.primary_25,
          borderColor: t.palette.primary_300,
        },
      ],
      avatarBadge: {
        backgroundColor: t.palette.primary_500,
      },
      avatarCutout: {
        color: t.atoms.bg.backgroundColor,
      },
    }),
    [t],
  )
}

const styles = StyleSheet.create({
  trigger: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  loadLatestInline: {
    left: web('calc(50vw - 282px)'),
  },
  loadLatestInlineOffset: {
    left: web(`calc(50vw - 282px + ${CENTER_COLUMN_OFFSET}px)`),
  },
  loadLatestOutOfLine: {
    left: web('calc(50vw - 382px)'),
  },
})

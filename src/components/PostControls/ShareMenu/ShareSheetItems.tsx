import {useMemo} from 'react'
import {AtUri} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {makeProfileLink} from '#/lib/routes/links'
import {copyUrl, simpleShareText} from '#/lib/sharing'
import {toShareUrl, toShareUrlBsky} from '#/lib/strings/url-helpers'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {
  toAtprotoExplorerUrl,
  useAtprotoExplorer,
} from '#/state/preferences/atproto-explorer'
import {precachePost} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {
  Bookmark_Filled_Corner0_Rounded as BookmarkFilledIcon,
  Bookmark_Stroke2_Corner0_Rounded as BookmarkIcon,
} from '#/components/icons/Bookmark'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {BlueskyIcon} from '#/components/icons/services/Bluesky'
import {PDSlsIcon} from '#/components/icons/services/PDSls'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalIcon} from '#/components/icons/SquareArrowTopRight'
import * as Menu from '#/components/Menu'
import {type ShareAction} from '#/components/ShareDialog/ShareRow'
import {ShareSheetOuter} from '#/components/ShareDialog/ShareSheet'
import {type ShareSubject} from '#/components/ShareDialog/types'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {usePostBookmark} from '../BookmarkButton'
import {type ShareMenuItemsProps} from './ShareMenuItems.types'

/**
 * The redesigned share sheet (APP-3670) for a post, behind
 * `share_destinations:enable`. Includes post-specific save, copy and open actions.
 */
export function ShareSheetItems({
  post,
  onShare,
  logContext,
}: ShareMenuItemsProps): React.ReactNode {
  const {hasSession} = useSession()
  const {t: l} = useLingui()
  const [devModeEnabled] = useDevMode()
  const queryClient = useQueryClient()
  const openLink = useOpenLink()
  const atprotoExplorer = useAtprotoExplorer()

  const postUri = post.uri
  const postAuthor = useProfileShadow(post.author)
  const {isBookmarked, toggleBookmark} = usePostBookmark({
    post,
    logContext,
    entryPoint: 'ShareMenu',
  })

  const href = useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const hideInPWI = useMemo(() => {
    return !!postAuthor.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
  }, [postAuthor])

  const subject: ShareSubject = {
    type: 'post',
    uri: postUri,
    authorDid: postAuthor.did,
    url: toShareUrl(href),
    title: l({
      message: `Post by @${postAuthor.handle} on Bluesky`,
      comment: 'Prefilled subject line when sharing a post to email or Reddit',
    }),
    loggedInOnlyNotice: hideInPWI
      ? l`This post is only visible to logged-in users.`
      : undefined,
    chatEmbed: postUri,
  }

  const actions: ShareAction[] = hasSession
    ? [
        {
          id: 'save',
          label: isBookmarked
            ? l({
                message: 'Saved',
                comment:
                  'Share menu toggle label once the post is in saved posts; tapping again removes it',
              })
            : l({
                message: 'Save',
                comment: 'Share menu toggle that adds the post to saved posts',
              }),
          accessibilityLabel: isBookmarked
            ? l`Remove from saved posts`
            : l`Add to saved posts`,
          icon: isBookmarked ? BookmarkFilledIcon : BookmarkIcon,
          active: isBookmarked,
          stayOpen: true,
          onPress: () => void toggleBookmark(),
        },
      ]
    : []

  const explorerUrl = toAtprotoExplorerUrl(atprotoExplorer, postUri)
  const originalPostUrl = (post.record.bridgyOriginalUrl ||
    post.record.fediverseId) as string | undefined

  if (originalPostUrl) {
    actions.push({
      id: 'open-original-post',
      label: l`Original`,
      icon: ExternalIcon,
      onPress: () => openLink(originalPostUrl),
    })
  }

  actions.push(
    {
      id: 'open-explorer',
      label: l`${atprotoExplorer.name}`,
      icon: atprotoExplorer.name === 'PDSls' ? PDSlsIcon : ExternalIcon,
      onPress: () => openLink(explorerUrl),
    },
    {
      id: 'open-skythread',
      label: l`Skythread`,
      icon: ExternalIcon,
      onPress: () =>
        openLink(
          `https://skythread.mackuba.eu/?q=${encodeURIComponent(toShareUrlBsky(href))}`,
        ),
    },
    {
      id: 'copy-at-uri',
      label: l`Copy URI`,
      icon: ClipboardIcon,
      onPress: () => void copyUrl(postUri).then(onShare),
    }
  )

  const onShareATURI = () => {
    void simpleShareText(postUri)
  }

  const onShareAuthorDID = () => {
    void simpleShareText(postAuthor.did)
  }

  return (
    <ShareSheetOuter
      subject={subject}
      actions={actions}
      onShare={onShare}
      onBeforeSendToChat={() => precachePost(queryClient, postUri, post)}>
      {devModeEnabled && (
        <Menu.Group>
          <Menu.Item
            testID="postAtUriShareBtn"
            label={l`Share post at:// URI`}
            onPress={onShareATURI}>
            <Menu.ItemText>
              <Trans>Share post at:// URI</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ClipboardIcon} position="right" />
          </Menu.Item>
          <Menu.Item
            testID="postAuthorDIDShareBtn"
            label={l`Share author DID`}
            onPress={onShareAuthorDID}>
            <Menu.ItemText>
              <Trans>Share author DID</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ClipboardIcon} position="right" />
          </Menu.Item>
        </Menu.Group>
      )}
    </ShareSheetOuter>
  )
}

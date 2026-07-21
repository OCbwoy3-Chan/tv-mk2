import {memo, useMemo, useRef} from 'react'
import * as ExpoClipboard from 'expo-clipboard'
import {AtUri} from '@atproto/api'
import {isIOS} from '@bsky.app/alf'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {toShareUrl, toShareUrlBsky} from '#/lib/strings/url-helpers'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {
  toAtprotoExplorerUrl,
  useAtprotoExplorer,
} from '#/state/preferences/atproto-explorer'
import {precachePost} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {useDialogControl} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlaneIcon} from '#/components/icons/PaperPlane'
import {BlueskyIcon} from '#/components/icons/services/Bluesky'
import {PDSlsIcon} from '#/components/icons/services/PDSls'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalIcon} from '#/components/icons/SquareArrowTopRight'
import * as Menu from '#/components/Menu'
import {CheckboxItemText} from '#/components/Menu/CheckboxItem'
import * as Toast from '#/components/Toast'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {IS_IOS} from '#/env'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {RecentChats} from './RecentChats'
import {type ShareMenuItemsProps} from './ShareMenuItems.types'

let ShareMenuItems = ({
  post,
  onShare: onShareProp,
}: ShareMenuItemsProps): React.ReactNode => {
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const sendViaChatControl = useDialogControl()
  const [devModeEnabled] = useDevMode()
  const aa = useAgeAssurance()
  const openLink = useOpenLink()
  const queryClient = useQueryClient()
  const copyLinksRef = useRef(false)

  const postUri = post.uri
  const postAuthor = useProfileShadow(post.author)

  const href = useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const hideInPWI = useMemo(() => {
    return !!postAuthor.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
  }, [postAuthor])

  const onSharePostBsky = () => {
    ax.metric('share:press:nativeShare', {})
    const url = toShareUrlBsky(href)
    void shareUrl(url)
    onShareProp()
  }

  const onCopyLink = async () => {
    ax.metric('share:press:copyLink', {})
    const url = toShareUrl(href)
    if (IS_IOS) {
      // iOS only
      await ExpoClipboard.setUrlAsync(url)
    } else {
      await ExpoClipboard.setStringAsync(url)
    }
    Toast.show(_(msg`Copied to clipboard`), {
      type: 'success',
    })
    onShareProp()
  }

  const onCopyLinkBsky = async () => {
    ax.metric('share:press:copyLink', {})
    const url = toShareUrlBsky(href)
    if (isIOS) {
      // iOS only
      await ExpoClipboard.setUrlAsync(url)
    } else {
      await ExpoClipboard.setStringAsync(url)
    }
    Toast.show(_(msg`Copied to clipboard`), {
      type: 'success',
    })
    onShareProp()
  }

  const onBeforeShareViaChat = () => {
    precachePost(queryClient, postUri, post)
  }

  const onSelectChatToShareTo = (conversation: string) => {
    onBeforeShareViaChat()
    navigation.navigate('MessagesConversation', {
      conversation,
      embed: postUri,
    })
  }

  const onShareATURI = () => {
    void shareText(postUri)
  }

  const onShareAuthorDID = () => {
    void shareText(postAuthor.did)
  }

  const atprotoExplorer = useAtprotoExplorer()
  const isBridgedPost =
    !!post.record.bridgyOriginalUrl || !!post.record.fediverseId
  const originalPostUrl = (post.record.bridgyOriginalUrl ||
    post.record.fediverseId) as string | undefined

  const onOpenOriginalPost = () => {
    if (originalPostUrl) {
      openLink(originalPostUrl, true)
    }
  }

  const onOpenPostInAtprotoExplorer = () => {
    openLink(toAtprotoExplorerUrl(atprotoExplorer, post.uri), true)
  }

  const onOpenPostInSkythread = () => {
    openLink(
      `https://skythread.mackuba.eu/?q=${encodeURIComponent(
        toShareUrlBsky(href),
      )}`,
      true,
    )
  }

  return (
    <>
      <Menu.Outer>
        {hasSession && aa.state.access === aa.Access.Full && (
          <Menu.Group>
            <Menu.ContainerItem>
              <RecentChats
                postUri={postUri}
                onBeforePress={onBeforeShareViaChat}
              />
            </Menu.ContainerItem>
            <Menu.Item
              testID="postDropdownSendViaDMBtn"
              label={_(msg`Send via direct message`)}
              onPress={() => {
                ax.metric('share:press:openDmSearch', {})
                sendViaChatControl.open()
              }}>
              <Menu.ItemText>
                <Trans>Send via direct message</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={PaperPlaneIcon} position="right" />
            </Menu.Item>
          </Menu.Group>
        )}

        <Menu.Group>
          <Menu.Item
            testID="postDropdownCopyLinkBtn"
            label={_(msg`Copy link to post`)}
            onPress={onCopyLink}>
            <Menu.ItemText>
              <Trans>Copy link to post</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ChainLinkIcon} position="right" />
          </Menu.Item>

          <Menu.Submenu
            label={_(msg`Share`)}
            trigger={
              <>
                <Menu.ItemText>
                  <Trans>Share</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ChevronRightIcon} position="right" />
              </>
            }>
            <Menu.Group>
              <Menu.Item
                testID="postDropdownShareBlueskyBtn"
                label={_(msg`Bluesky`)}
                onPress={() => {
                  if (copyLinksRef.current) {
                    void onCopyLinkBsky()
                  } else {
                    onSharePostBsky()
                  }
                }}>
                <Menu.ItemText>
                  <Trans>Bluesky</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={BlueskyIcon} position="right" />
              </Menu.Item>
              <Menu.ContainerItem>
                <CheckboxItemText
                  label={_(msg`Copy instead of opening the share sheet`)}
                  initialValue={copyLinksRef.current}
                  onChange={value => {
                    copyLinksRef.current = value
                  }}>
                  <Trans>Copy</Trans>
                </CheckboxItemText>
              </Menu.ContainerItem>
            </Menu.Group>
          </Menu.Submenu>

          <Menu.Submenu
            label={_(msg`Open`)}
            trigger={
              <>
                <Menu.ItemText>
                  <Trans>Open</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ChevronRightIcon} position="right" />
              </>
            }>
            <Menu.Group>
              {isBridgedPost && (
                <Menu.Item
                  testID="postDropdownOpenOriginalPost"
                  label={_(msg`Original post`)}
                  onPress={onOpenOriginalPost}>
                  <Menu.ItemText>
                    <Trans>Original post</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={ExternalIcon} position="right" />
                </Menu.Item>
              )}
              <Menu.Item
                testID="postDropdownOpenInAtprotoExplorer"
                label={atprotoExplorer.name}
                onPress={onOpenPostInAtprotoExplorer}>
                <Menu.ItemText>{atprotoExplorer.name}</Menu.ItemText>
                <Menu.ItemIcon
                  icon={
                    atprotoExplorer.name === 'PDSls' ? PDSlsIcon : ChainLinkIcon
                  }
                  position="right"
                />
              </Menu.Item>
              <Menu.Item
                testID="postDropdownOpenInSkythread"
                label={_(msg`Skythread`)}
                onPress={onOpenPostInSkythread}>
                <Menu.ItemText>
                  <Trans>Skythread</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ExternalIcon} position="right" />
              </Menu.Item>
            </Menu.Group>
          </Menu.Submenu>
        </Menu.Group>

        {hideInPWI && (
          <Menu.Group>
            <Menu.ContainerItem>
              <Admonition
                type="warning"
                style={[a.flex_1, a.border_0, a.p_0, a.bg_transparent]}>
                <Trans>This post is only visible to logged-in users.</Trans>
              </Admonition>
            </Menu.ContainerItem>
          </Menu.Group>
        )}

        {devModeEnabled && (
          <Menu.Group>
            <Menu.Item
              testID="postAtUriShareBtn"
              label={_(msg`Share post at:// URI`)}
              onPress={onShareATURI}>
              <Menu.ItemText>
                <Trans>Share post at:// URI</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ClipboardIcon} position="right" />
            </Menu.Item>
            <Menu.Item
              testID="postAuthorDIDShareBtn"
              label={_(msg`Share author DID`)}
              onPress={onShareAuthorDID}>
              <Menu.ItemText>
                <Trans>Share author DID</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ClipboardIcon} position="right" />
            </Menu.Item>
          </Menu.Group>
        )}
      </Menu.Outer>

      <SendViaChatDialog
        control={sendViaChatControl}
        onSelectChat={onSelectChatToShareTo}
      />
    </>
  )
}
ShareMenuItems = memo(ShareMenuItems)
export {ShareMenuItems}

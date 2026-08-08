import {isInvalidHandle} from '#/lib/strings/handles'
import {useShowLinkInHandle} from '#/state/preferences/show-link-in-handle'
import {useShowLinkInHandleOnlyOnWorkingLinks} from '#/state/preferences/show-link-in-handle-only-on-working-links'
import {useHandleLinkQuery} from '#/state/queries/handle-link'

export function useProfileHandleLink(handle: string) {
  const invalidHandle = isInvalidHandle(handle)
  const isBskySocialHandle = handle.endsWith('.bsky.social')
  const showProfileInHandle = useShowLinkInHandle()
  const showLinkInHandleOnlyOnWorkingLinks =
    useShowLinkInHandleOnlyOnWorkingLinks()
  const shouldCheckHandleLink =
    showProfileInHandle &&
    showLinkInHandleOnlyOnWorkingLinks &&
    !invalidHandle &&
    !isBskySocialHandle
  const {data: hasWorkingHandleLink = false} = useHandleLinkQuery(
    handle,
    shouldCheckHandleLink,
  )

  return (
    !invalidHandle &&
    showProfileInHandle &&
    !isBskySocialHandle &&
    (!showLinkInHandleOnlyOnWorkingLinks || hasWorkingHandleLink)
  )
}

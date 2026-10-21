import {isLinkPreviewRequest} from '../_shared/link-preview.ts'
import {handleProfileEmbed} from '../_shared/profile-embed.ts'

export function onRequest(context) {
  return isLinkPreviewRequest(context.request)
    ? handleProfileEmbed(context)
    : context.next()
}

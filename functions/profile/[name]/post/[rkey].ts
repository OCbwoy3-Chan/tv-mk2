import {isLinkPreviewRequest} from '../../../_shared/link-preview.ts'
import {handlePostEmbed} from '../../../_shared/post-embed.ts'

export function onRequest(context) {
  return isLinkPreviewRequest(context.request)
    ? handlePostEmbed(context)
    : context.next()
}

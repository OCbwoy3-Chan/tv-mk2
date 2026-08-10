import {type $Typed, type AppBskyEmbedGallery} from '@atproto/api'

import {type ComposerImage} from '#/state/gallery'

/** Reuses the original blob when an untouched gallery image is redrafted. */
export function reuseGalleryImageBlob(
  image: ComposerImage,
): $Typed<AppBskyEmbedGallery.Image> | undefined {
  if (!image.blobRef) {
    return undefined
  }

  return {
    $type: 'app.bsky.embed.gallery#image',
    image: image.blobRef,
    alt: image.alt,
    aspectRatio: {
      width: image.source.width,
      height: image.source.height,
    },
  }
}

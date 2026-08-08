import {
  AppBskyEmbedGallery,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type BlobRef,
} from '@atproto/api'

export type RedraftImage = {
  uri: string
  width: number
  height: number
  altText?: string
  blobRef?: BlobRef
}

/** Restores image and gallery media from a post into composer image inputs. */
export function getRedraftImages(
  recordEmbed: AppBskyFeedPost.Record['embed'],
  viewEmbed: AppBskyFeedDefs.PostView['embed'],
): RedraftImage[] {
  const recordMedia =
    recordEmbed?.$type === 'app.bsky.embed.recordWithMedia'
      ? (recordEmbed as AppBskyEmbedRecordWithMedia.Main).media
      : recordEmbed
  const viewMedia =
    viewEmbed?.$type === 'app.bsky.embed.recordWithMedia#view'
      ? (viewEmbed as AppBskyEmbedRecordWithMedia.View).media
      : viewEmbed

  if (viewMedia?.$type === 'app.bsky.embed.images#view') {
    const viewImages = (viewMedia as AppBskyEmbedImages.View).images
    const blobs =
      recordMedia?.$type === 'app.bsky.embed.images'
        ? (recordMedia as AppBskyEmbedImages.Main).images.map(
            image => image.image,
          )
        : []
    return viewImages.map((image, index) => ({
      uri: image.fullsize,
      width: image.aspectRatio?.width ?? 1000,
      height: image.aspectRatio?.height ?? 1000,
      altText: image.alt,
      blobRef: blobs[index],
    }))
  }

  if (viewMedia?.$type === 'app.bsky.embed.gallery#view') {
    const viewItems = (viewMedia as AppBskyEmbedGallery.View).items.filter(
      AppBskyEmbedGallery.isViewImage,
    )
    const blobs =
      recordMedia?.$type === 'app.bsky.embed.gallery'
        ? (recordMedia as AppBskyEmbedGallery.Main).items
            .filter(AppBskyEmbedGallery.isImage)
            .map(image => image.image)
        : []
    return viewItems.map((image, index) => ({
      uri: image.fullsize,
      width: image.aspectRatio?.width ?? 1000,
      height: image.aspectRatio?.height ?? 1000,
      altText: image.alt,
      blobRef: blobs[index],
    }))
  }

  return []
}

import {
  type AppBskyEmbedGallery,
  type AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type BlobRef,
} from '@atproto/api'

import {getRedraftImages} from './redraft'

const blobs = Array.from({length: 5}, (_, index) =>
  ({ref: {toString: () => `blob-${index}`}} as unknown as BlobRef),
)

const recordGallery = {
  $type: 'app.bsky.embed.gallery',
  items: blobs.map((image, index) => ({
    $type: 'app.bsky.embed.gallery#image',
    image,
    alt: `alt ${index}`,
    aspectRatio: {width: index + 1, height: index + 2},
  })),
} as AppBskyEmbedGallery.Main

const viewGallery = {
  $type: 'app.bsky.embed.gallery#view',
  items: blobs.map((_, index) => ({
    $type: 'app.bsky.embed.gallery#viewImage',
    thumbnail: `https://cdn.example/${index}/thumb`,
    fullsize: `https://cdn.example/${index}/full`,
    alt: `alt ${index}`,
    aspectRatio: {width: index + 1, height: index + 2},
  })),
} as AppBskyEmbedGallery.View

describe('getRedraftImages', () => {
  it('restores galleries with more than four images', () => {
    const images = getRedraftImages(
      recordGallery as AppBskyFeedPost.Record['embed'],
      viewGallery as AppBskyFeedDefs.PostView['embed'],
    )

    expect(images).toHaveLength(5)
    expect(images[4]).toEqual({
      uri: 'https://cdn.example/4/full',
      width: 5,
      height: 6,
      altText: 'alt 4',
      blobRef: blobs[4],
    })
  })

  it('restores a gallery combined with a quote', () => {
    const recordEmbed = {
      $type: 'app.bsky.embed.recordWithMedia',
      record: {
        $type: 'app.bsky.embed.record',
        record: {uri: 'at://did:plc:quoted/app.bsky.feed.post/1', cid: 'cid'},
      },
      media: recordGallery,
    } as AppBskyEmbedRecordWithMedia.Main
    const viewEmbed = {
      $type: 'app.bsky.embed.recordWithMedia#view',
      record: {$type: 'app.bsky.embed.record#view', record: {$type: 'unknown'}},
      media: viewGallery,
    } as unknown as AppBskyEmbedRecordWithMedia.View

    expect(
      getRedraftImages(
        recordEmbed as AppBskyFeedPost.Record['embed'],
        viewEmbed as AppBskyFeedDefs.PostView['embed'],
      ),
    ).toHaveLength(5)
  })
})

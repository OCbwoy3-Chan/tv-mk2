import {BlobRef} from '@atproto/api'
import {toDatetimeString} from '@atproto/syntax'
import {RichText} from '@bsky/sdk/richtext'
import {CID} from 'multiformats/cid'

import {type ComposerState} from '#/view/com/composer/state/composer'
import {decodeRecovery, encodeRecovery} from './codec'

jest.unmock('multiformats/cid')

jest.mock('#/lib/media/video/telemetry', () => ({
  createVideoTelemetry: jest.fn(() => ({published: jest.fn()})),
}))

function composition(): ComposerState {
  return {
    activePostIndex: 1,
    mutableNeedsFocusActive: false,
    isDirty: true,
    draftId: 'existing-draft',
    loadedMediaMap: new Map([['photo', 'file:///photo.jpg']]),
    originalLocalRefs: new Set(['photo']),
    thread: {
      postgate: {
        $type: 'app.bsky.feed.postgate',
        post: 'at://did:plc:author/app.bsky.feed.post/test',
        createdAt: toDatetimeString(new Date()),
      },
      threadgate: [],
      posts: ['first post', 'second post'].map((text, index) => ({
        id: String(index),
        richtext: new RichText({text}),
        shortenedGraphemeLength: text.length,
        labels: [],
        tags: ['tag'],
        embed: {quote: undefined, media: undefined, link: undefined},
      })),
    },
  }
}

it('restores an editable thread with its focus and draft bookkeeping', () => {
  const state = composition()
  const {state: restored, opts} = decodeRecovery(
    encodeRecovery(
      {activeAccountDid: 'did:plc:author', onPost: jest.fn()},
      state,
    ),
  )
  expect(opts).toEqual({activeAccountDid: 'did:plc:author'})
  expect(restored.activePostIndex).toBe(1)
  expect(restored.mutableNeedsFocusActive).toBe(true)
  expect(restored.draftId).toBe('existing-draft')
  expect(restored.isDirty).toBe(true)
  expect(restored.loadedMediaMap?.get('photo')).toBe('file:///photo.jpg')
  expect(restored.originalLocalRefs?.has('photo')).toBe(true)
  expect(restored.thread.posts.map(p => p.richtext.text)).toEqual([
    'first post',
    'second post',
  ])
  expect(restored.thread.posts[0].richtext).toBeInstanceOf(RichText)
  expect(restored.thread.posts[0].richtext.graphemeLength).toBe(10)
  expect(restored.thread.posts[0].tags).toEqual(['tag'])
})

it('rejects incompatible snapshots instead of restoring invalid state', () => {
  const raw = encodeRecovery({}, composition())
  expect(() =>
    decodeRecovery(raw.replace('"version":1', '"version":2')),
  ).toThrow()
  expect(() => decodeRecovery('{')).toThrow()
})

it('restores attached blobs with usable cids and image metadata', () => {
  const state = composition()
  const ref = CID.parse(
    'bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
  )
  state.thread.posts[0].embed.media = {
    type: 'images',
    images: [
      {
        alt: 'description',
        source: {
          id: 'image',
          path: 'file:///photo.jpg',
          width: 100,
          height: 100,
          mime: 'image/jpeg',
        },
        blobRef: new BlobRef(ref, 'image/jpeg', 123),
      },
    ],
  }
  const restored = decodeRecovery(encodeRecovery({}, state))
  const media = restored.state.thread.posts[0].embed.media
  expect(media?.type).toBe('images')
  if (media?.type !== 'images') throw new Error('missing images')
  expect(media.images[0].alt).toBe('description')
  expect(media.images[0].blobRef?.ref.toString()).toBe(ref.toString())
  expect(media.images[0].blobRef?.toJSON()).toEqual(
    state.thread.posts[0].embed.media.images[0].blobRef?.toJSON(),
  )
})

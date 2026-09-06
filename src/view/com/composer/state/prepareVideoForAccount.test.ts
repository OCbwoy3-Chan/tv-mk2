import {type Client} from '@atproto/lex'
import {type I18n} from '@lingui/core'

import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {prepareVideoForAccount} from './prepareVideoForAccount'
import {processVideo, type VideoState} from './video'

jest.mock('./video', () => ({processVideo: jest.fn()}))
jest.mock('#/state/queries/resolve-identity', () => ({
  resolvePdsServiceUrl: jest.fn(),
}))

type DoneVideo = Extract<VideoState, {status: 'done'}>
const originalBlob = {cid: 'original', mimeType: 'video/mp4'}
const uploadedBlob = {cid: 'uploaded', mimeType: 'video/mp4'}
const client = {
  assertDid: 'did:plc:destination',
  uploadBlob: jest.fn(),
} as unknown as Client
const i18n = {} as I18n
const originalFetch = global.fetch

function makeVideo(local = true): DoneVideo {
  return {
    status: 'done',
    asset: local ? {uri: 'file:///local.mp4'} : null,
    abortController: new AbortController(),
    pendingPublish: {blobRef: originalBlob, ownerDid: 'did:plc:source'},
    captions: [{lang: 'en', file: {name: 'captions.vtt'}}],
    altText: 'A video description',
    telemetry: {},
  } as unknown as DoneVideo
}

beforeEach(() => jest.clearAllMocks())
afterEach(() => {
  global.fetch = originalFetch
})

it('reuses a video already uploaded to the posting account', async () => {
  const video = makeVideo()
  video.pendingPublish.ownerDid = client.assertDid
  expect(
    await prepareVideoForAccount(
      video,
      client,
      'https://destination.test',
      'did:plc:source',
      i18n,
    ),
  ).toBe(video)
  expect(processVideo).not.toHaveBeenCalled()
})

it('uploads the local asset for a changed account and retains alt text and captions', async () => {
  const video = makeVideo()
  jest
    .mocked(processVideo)
    .mockImplementation((_, dispatch, uploadClient, dispatchUrl, signal) => {
      expect(uploadClient).toBe(client)
      expect(dispatchUrl).toBe('https://destination.test')
      dispatch({type: 'to_done', blobRef: uploadedBlob as never, signal})
      return Promise.resolve()
    })
  const result = await prepareVideoForAccount(
    video,
    client,
    'https://destination.test',
    'did:plc:source',
    i18n,
  )
  expect(result.pendingPublish).toEqual({
    blobRef: uploadedBlob,
    ownerDid: client.assertDid,
  })
  expect(result.altText).toBe(video.altText)
  expect(result.captions).toBe(video.captions)
  expect(client.uploadBlob).not.toHaveBeenCalled()
})

it('does not publish the old blob when the destination upload fails', async () => {
  jest
    .mocked(processVideo)
    .mockImplementation((_, dispatch, __, ___, signal) => {
      dispatch({type: 'to_error', error: 'Upload failed', signal})
      return Promise.resolve()
    })
  await expect(
    prepareVideoForAccount(
      makeVideo(),
      client,
      'https://destination.test',
      'did:plc:source',
      i18n,
    ),
  ).rejects.toThrow('Upload failed')
})

it('copies redrafted video and captions from their original PDS', async () => {
  const video = {
    ...makeVideo(false),
    originalCaptions: [
      {lang: 'fr', file: {cid: 'caption', mimeType: 'text/vtt'}},
    ],
  } as unknown as DoneVideo
  jest.mocked(resolvePdsServiceUrl).mockResolvedValue('https://source.test')
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(2)),
    })
  jest
    .mocked(client.uploadBlob)
    .mockResolvedValue({body: {blob: uploadedBlob}} as never)
  const result = await prepareVideoForAccount(
    video,
    client,
    'https://destination.test',
    'did:plc:other',
    i18n,
  )
  expect(resolvePdsServiceUrl).toHaveBeenCalledWith('did:plc:source')
  expect((jest.mocked(fetch).mock.calls[0][0] as URL).href).toContain(
    'https://source.test/xrpc/com.atproto.sync.getBlob?',
  )
  expect(client.uploadBlob).toHaveBeenCalledTimes(2)
  expect(
    'originalCaptions' in result && result.originalCaptions?.[0].lang,
  ).toBe('fr')
})

import {File, Paths} from 'expo-file-system'
import {Album, Asset, requestPermissionsAsync} from 'expo-media-library'

import {
  saveImageToMediaLibrary,
  saveVideoToMediaLibrary,
} from '#/lib/media/manip'
import * as env from '#/env'

jest.mock('#/logger', () => ({logger: {error: jest.fn()}}))
jest.mock('#/env', () => ({
  __esModule: true,
  IS_ANDROID: false,
  IS_IOS: true,
  IS_NATIVE: true,
}))
jest.mock('#/lib/media/original-image', () => ({
  getDownloadImageUri: (uri: string) => Promise.resolve(uri),
}))

/** A downloaded file whose type Expo derived, or failed to, from the headers. */
function mockDownload(type: string | null, header?: number[]) {
  jest.mocked(File.downloadFileAsync).mockImplementation(() => {
    const file = new File('file://cache/download/com.atproto.sync.getBlob')
    Object.assign(file, {
      type,
      open: () => ({
        readBytesSync: () => new Uint8Array(header ?? []),
        close: jest.fn(),
      }),
    })
    return Promise.resolve(file)
  })
}

function deletedPaths() {
  return jest.mocked(Paths.info).mock.calls.map(([path]) => path)
}

/** Bytes 4-12 of an ISO media file name its type and brand. */
function isoHeader(brand: string) {
  return [0, 0, 0, 0x1c, ...[...`ftyp${brand}`].map(c => c.charCodeAt(0))]
}

const avifHeader = isoHeader('avif')

beforeEach(() => jest.clearAllMocks())
afterEach(() => jest.restoreAllMocks())

it.each([
  ['the derived type', 'image/avif', undefined],
  ['sniffed bytes', null, avifHeader],
])('saves Android AVIF downloads using %s', async (_label, type, header) => {
  jest.replaceProperty(env, 'IS_ANDROID', true)
  mockDownload(type, header)

  await saveImageToMediaLibrary({
    uri: 'https://cdn.example/image',
    format: 'original',
    downloadName: 'alice.example-3abc-1',
  })

  expect(Album.create).toHaveBeenCalledWith('Witchsky', [
    expect.stringMatching(/\/witchsky-alice\.example-3abc-1\.avif$/),
  ])
})

it('saves original images with a descriptive basename and cleans up', async () => {
  mockDownload('image/png')
  await saveImageToMediaLibrary({
    uri: 'https://pds.example/image',
    downloadName: 'alice.example-3abc-1',
  })
  expect(Asset.create).toHaveBeenCalledWith(
    expect.stringMatching(/\/witchsky-alice\.example-3abc-1\.png$/),
  )
  const path = jest.mocked(Asset.create).mock.calls[0][0]
  expect(deletedPaths()).toContain(path.slice(0, path.lastIndexOf('/')))
})

it('uses distinct staging folders for repeated filenames and cleans up failed saves', async () => {
  mockDownload('video/mp4')
  await saveVideoToMediaLibrary({
    uri: 'https://pds.example/video',
    downloadName: 'alice.example-3abc',
  })
  jest.mocked(Asset.create).mockRejectedValueOnce(new Error('save failed'))
  await expect(
    saveVideoToMediaLibrary({
      uri: 'https://pds.example/video',
      downloadName: 'alice.example-3abc',
    }),
  ).rejects.toThrow('save failed')
  const [[first], [second]] = jest.mocked(Asset.create).mock.calls
  expect(first).toMatch(/\/witchsky-alice\.example-3abc\.mp4$/)
  expect(second).toMatch(/\/witchsky-alice\.example-3abc\.mp4$/)
  expect(first).not.toBe(second)
  expect(deletedPaths()).toContain(second.slice(0, second.lastIndexOf('/')))
  expect(requestPermissionsAsync).toHaveBeenCalledWith(true)
})

it('saves Android videos directly to the Witchsky album', async () => {
  jest.replaceProperty(env, 'IS_ANDROID', true)
  jest.replaceProperty(env, 'IS_IOS', false)
  mockDownload(null, isoHeader('isom'))

  await saveVideoToMediaLibrary({
    uri: 'https://pds.example/video',
    downloadName: 'alice.example-3abc',
  })

  expect(Album.create).toHaveBeenCalledWith('Witchsky', [
    expect.stringMatching(/\/witchsky-alice\.example-3abc\.mp4$/),
  ])
  expect(Asset.create).not.toHaveBeenCalled()
})

it('reports Android album failures without saving images to another folder', async () => {
  jest.replaceProperty(env, 'IS_ANDROID', true)
  mockDownload('image/png')
  jest.mocked(Album.create).mockRejectedValueOnce(new Error('save failed'))

  await expect(
    saveImageToMediaLibrary({uri: 'https://pds.example/image'}),
  ).rejects.toThrow('save failed')

  expect(Album.create).toHaveBeenCalledTimes(1)
  expect(Asset.create).not.toHaveBeenCalled()
  const [path] = jest.mocked(Album.create).mock.calls[0][1] as string[]
  expect(deletedPaths()).toContain(path.slice(0, path.lastIndexOf('/')))
})

import {
  copyAsync,
  createDownloadResumable,
  deleteAsync,
  moveAsync,
} from 'expo-file-system/legacy'
import {createAlbumAsync, saveToLibraryAsync} from 'expo-media-library/legacy'

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
  getDownloadImageUri: (uri: string, format: string) =>
    Promise.resolve(format === 'jpeg' ? `${uri}@jpeg` : uri),
}))
jest.mock('expo-media-library/legacy', () => ({
  createAlbumAsync: jest.fn().mockResolvedValue(undefined),
  saveToLibraryAsync: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  createDownloadResumable: jest.fn(),
}))

beforeEach(() => jest.clearAllMocks())
afterEach(() => jest.restoreAllMocks())

it.each(['content-type', 'Content-Type', 'CONTENT-TYPE'])(
  'saves Android AVIF downloads using the %s response header',
  async header => {
    jest.replaceProperty(env, 'IS_ANDROID', true)
    jest.mocked(createDownloadResumable).mockReturnValue({
      downloadAsync: () =>
        Promise.resolve({
          status: 200,
          uri: 'file:///cache/download.bin',
          headers: {[header]: 'image/avif; charset=binary'},
        }),
    } as unknown as ReturnType<typeof createDownloadResumable>)

    await saveImageToMediaLibrary({
      uri: 'https://cdn.example/image',
      format: 'avif',
      downloadName: 'alice.example-3abc-1',
    })

    expect(createAlbumAsync).toHaveBeenCalledWith(
      'Witchsky',
      undefined,
      undefined,
      expect.stringMatching(/\/witchsky-alice\.example-3abc-1\.avif$/),
    )
  },
)

it('saves original images with a descriptive basename and their downloaded MIME extension', async () => {
  jest.mocked(createDownloadResumable).mockReturnValue({
    downloadAsync: () =>
      Promise.resolve({
        status: 200,
        uri: 'file:///cache/download.bin',
        mimeType: 'image/png',
      }),
  } as unknown as ReturnType<typeof createDownloadResumable>)
  await saveImageToMediaLibrary({
    uri: 'https://pds.example/image',
    downloadName: 'alice.example-3abc-1',
  })
  expect(saveToLibraryAsync).toHaveBeenCalledWith(
    expect.stringMatching(/\/witchsky-alice\.example-3abc-1\.png$/),
  )
  const path = jest.mocked(saveToLibraryAsync).mock.calls[0][0]
  expect(deleteAsync).toHaveBeenCalledWith(
    path.slice(0, path.lastIndexOf('/')),
    {idempotent: true},
  )
})

it('uses distinct staging folders for repeated filenames and cleans up failed saves', async () => {
  jest.mocked(createDownloadResumable).mockReturnValue({
    downloadAsync: () =>
      Promise.resolve({
        status: 200,
        uri: 'file:///cache/download.bin',
        headers: {'content-type': 'video/mp4'},
      }),
  } as unknown as ReturnType<typeof createDownloadResumable>)
  await saveVideoToMediaLibrary({
    uri: 'https://pds.example/video',
    downloadName: 'alice.example-3abc',
  })
  jest
    .mocked(saveToLibraryAsync)
    .mockRejectedValueOnce(new Error('save failed'))
  await expect(
    saveVideoToMediaLibrary({
      uri: 'https://pds.example/video',
      downloadName: 'alice.example-3abc',
    }),
  ).rejects.toThrow('save failed')
  const first = jest.mocked(saveToLibraryAsync).mock.calls[0][0]
  const second = jest.mocked(saveToLibraryAsync).mock.calls[1][0]
  expect(first).toMatch(/\/witchsky-alice\.example-3abc\.mp4$/)
  expect(second).toMatch(/\/witchsky-alice\.example-3abc\.mp4$/)
  expect(first).not.toBe(second)
  expect(deleteAsync).toHaveBeenCalledWith(
    second.slice(0, second.lastIndexOf('/')),
    {idempotent: true},
  )
  expect(copyAsync).toHaveBeenCalledTimes(2)
})

it('saves Android videos directly to the Witchsky album', async () => {
  jest.replaceProperty(env, 'IS_ANDROID', true)
  jest.mocked(createDownloadResumable).mockReturnValue({
    downloadAsync: () =>
      Promise.resolve({
        status: 200,
        uri: 'file:///cache/download.bin',
        headers: {'content-type': 'video/mp4'},
      }),
  } as unknown as ReturnType<typeof createDownloadResumable>)

  await saveVideoToMediaLibrary({
    uri: 'https://pds.example/video',
    downloadName: 'alice.example-3abc',
  })

  expect(createAlbumAsync).toHaveBeenCalledWith(
    'Witchsky',
    undefined,
    undefined,
    expect.stringMatching(/\/witchsky-alice\.example-3abc\.mp4$/),
  )
  expect(saveToLibraryAsync).not.toHaveBeenCalled()
})

it('reports Android album failures without saving images to another folder', async () => {
  jest.replaceProperty(env, 'IS_ANDROID', true)
  jest.mocked(createDownloadResumable).mockReturnValue({
    downloadAsync: () =>
      Promise.resolve({
        status: 200,
        uri: 'file:///cache/download.bin',
        headers: {'content-type': 'image/png'},
      }),
  } as unknown as ReturnType<typeof createDownloadResumable>)
  jest.mocked(createAlbumAsync).mockRejectedValueOnce(new Error('save failed'))

  await expect(
    saveImageToMediaLibrary({uri: 'https://pds.example/image'}),
  ).rejects.toThrow('save failed')

  expect(createAlbumAsync).toHaveBeenCalledTimes(1)
  expect(saveToLibraryAsync).not.toHaveBeenCalled()
  const path = jest.mocked(createAlbumAsync).mock.calls[0][3]!
  expect(deleteAsync).toHaveBeenCalledWith(
    path.slice(0, path.lastIndexOf('/')),
    {idempotent: true},
  )
})

it.each([
  {status: 404, mimeType: 'image/jpeg', message: 'HTTP 404'},
  {status: 503, mimeType: 'text/html', message: 'HTTP 503'},
  {
    status: 200,
    mimeType: 'application/json',
    message: 'unexpected content type',
  },
])('rejects invalid image responses: $status $mimeType', async response => {
  jest.mocked(createDownloadResumable).mockReturnValue({
    downloadAsync: () =>
      Promise.resolve({
        ...response,
        uri: 'file:///cache/download.bin',
        headers: {},
      }),
  } as unknown as ReturnType<typeof createDownloadResumable>)

  await expect(
    saveImageToMediaLibrary({uri: 'https://pds.example/image'}),
  ).rejects.toThrow(response.message)

  expect(saveToLibraryAsync).not.toHaveBeenCalled()
  expect(moveAsync).not.toHaveBeenCalled()
  expect(deleteAsync).toHaveBeenCalledWith('file:///cache/download.bin', {
    idempotent: true,
  })
})

it.each([
  {format: 'original', code: 'ERR_MISSING_FILE', retries: true},
  {format: 'jpeg', code: 'ERR_MISSING_FILE', retries: false},
  {format: 'original', code: 'ERR_SAVE_ASSET', retries: false},
])(
  'handles iOS $format save failure $code',
  async ({format, code, retries}) => {
    jest.mocked(createDownloadResumable).mockReturnValue({
      downloadAsync: () =>
        Promise.resolve({
          status: 200,
          uri: 'file:///cache/download.bin',
          mimeType: 'image/jpeg',
          headers: {},
        }),
    } as unknown as ReturnType<typeof createDownloadResumable>)
    jest
      .mocked(saveToLibraryAsync)
      .mockRejectedValueOnce(Object.assign(new Error('Save failed'), {code}))

    const save = saveImageToMediaLibrary({
      uri: 'https://cdn.example/image',
      format,
      downloadName: 'alice.example-3abc',
    })
    if (retries) {
      await save
      expect(createDownloadResumable).toHaveBeenLastCalledWith(
        'https://cdn.example/image@jpeg',
        expect.any(String),
        {cache: true},
      )
    } else {
      await expect(save).rejects.toThrow('Save failed')
    }
    expect(saveToLibraryAsync).toHaveBeenCalledTimes(retries ? 2 : 1)
    for (const [path] of jest.mocked(saveToLibraryAsync).mock.calls) {
      expect(deleteAsync).toHaveBeenCalledWith(
        path.slice(0, path.lastIndexOf('/')),
        {idempotent: true},
      )
    }
  },
)

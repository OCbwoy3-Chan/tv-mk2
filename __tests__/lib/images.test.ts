import {createDownloadResumable, deleteAsync} from 'expo-file-system/legacy'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '../../src/lib/constants'
import {
  downloadAndResize,
  type DownloadAndResizeOpts,
} from '../../src/lib/media/manip'
import {getResizedDimensions, resolveUploadImageMime, setWebpEncodeSupportForTests} from '../../src/lib/media/util'

const mockResizedImage = {
  path: 'file://resized-image.jpg',
  size: 100,
  width: 100,
  height: 100,
  mime: 'image/webp',
}

describe('downloadAndResize', () => {
  const errorSpy = jest.spyOn(global.console, 'error')

  beforeEach(() => {
    const mockedCreateResizedImage = manipulateAsync as jest.Mock
    mockedCreateResizedImage.mockResolvedValue({
      uri: 'file://resized-image.jpg',
      ...mockResizedImage,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return resized image for valid URI and options', async () => {
    const mockedFetch = createDownloadResumable as jest.Mock
    mockedFetch.mockReturnValue({
      cancelAsync: jest.fn(),
      downloadAsync: jest
        .fn()
        .mockResolvedValue({uri: 'file://resized-image.jpg'}),
    })

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(result).toEqual(mockResizedImage)
    expect(createDownloadResumable).toHaveBeenCalledWith(
      opts.uri,
      expect.anything(),
      {
        cache: true,
      },
    )

    // First time it gets called is to get dimensions
    expect(manipulateAsync).toHaveBeenCalledWith(expect.any(String), [], {})
    // The mocked source image is 100x100, below maxDimension, so it is not
    // downsized. Quality is binary-searched; assert format + a resize pass.
    expect(manipulateAsync).toHaveBeenCalledWith(
      expect.any(String),
      [{resize: {height: 100, width: 100}}],
      {format: SaveFormat.WEBP, compress: expect.any(Number)},
    )
    expect(deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    })
  })

  it('should return undefined for invalid URI', async () => {
    const opts: DownloadAndResizeOpts = {
      uri: 'invalid-uri',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(errorSpy).toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should not downsize whenever dimensions are below the max dimensions', () => {
    const initialDimensionsOne = {
      width: 1200,
      height: 1000,
    }
    const resizedDimensionsOne = getResizedDimensions(
      initialDimensionsOne,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    const initialDimensionsTwo = {
      width: 1000,
      height: 1200,
    }
    const resizedDimensionsTwo = getResizedDimensions(
      initialDimensionsTwo,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    expect(resizedDimensionsOne).toEqual(initialDimensionsOne)
    expect(resizedDimensionsTwo).toEqual(initialDimensionsTwo)
  })

  it('should resize dimensions and maintain aspect ratio if they are above the max dimensons', () => {
    const initialDimensionsOne = {
      width: 3000,
      height: 1500,
    }
    const resizedDimensionsOne = getResizedDimensions(
      initialDimensionsOne,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    const initialDimensionsTwo = {
      width: 2000,
      height: 4000,
    }
    const resizedDimensionsTwo = getResizedDimensions(
      initialDimensionsTwo,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    expect(resizedDimensionsOne).toEqual({
      width: 2000,
      height: 1000,
    })
    expect(resizedDimensionsTwo).toEqual({
      width: 1000,
      height: 2000,
    })
  })
})

describe('resolveUploadImageMime', () => {
  afterEach(() => {
    setWebpEncodeSupportForTests(undefined)
  })

  it('forces JPEG for HEIC/HEIF sources even when WebP is requested', () => {
    setWebpEncodeSupportForTests(true)
    expect(resolveUploadImageMime('image/heic', 'image/webp')).toBe(
      'image/jpeg',
    )
    expect(resolveUploadImageMime('image/heif', 'image/webp')).toBe(
      'image/jpeg',
    )
    expect(resolveUploadImageMime('image/HEIC', 'image/webp')).toBe(
      'image/jpeg',
    )
    expect(
      resolveUploadImageMime('image/heic-sequence', 'image/webp'),
    ).toBe('image/jpeg')
  })

  it('keeps the requested mime for non-HEIC sources when WebP encode works', () => {
    setWebpEncodeSupportForTests(true)
    expect(resolveUploadImageMime('image/jpeg', 'image/webp')).toBe(
      'image/webp',
    )
    expect(resolveUploadImageMime('image/png', 'image/webp')).toBe(
      'image/webp',
    )
    expect(resolveUploadImageMime('image/png', 'image/jpeg')).toBe(
      'image/jpeg',
    )
  })

  it('falls back to JPEG when the environment cannot encode WebP', () => {
    setWebpEncodeSupportForTests(false)
    expect(resolveUploadImageMime('image/jpeg', 'image/webp')).toBe(
      'image/jpeg',
    )
    expect(resolveUploadImageMime('image/png', 'image/webp')).toBe(
      'image/jpeg',
    )
  })
})

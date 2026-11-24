import {Paths} from 'expo-file-system'
import {type ImageManipulatorContext, SaveFormat} from 'expo-image-manipulator'
import {fromByteArray, toByteArray} from 'base64-js'

import {compressImage} from '#/lib/media/image/compress'
import {compressToFit} from '#/lib/media/image/compressToFit'
import {renderImage} from '#/lib/media/image-manipulator'
import {type ComposerImage} from '#/state/gallery'

jest.mock('#/lib/media/image-manipulator', () => ({renderImage: jest.fn()}))
jest.mock('#/lib/media/image/compressToFit', () => ({compressToFit: jest.fn()}))
jest.mock('#/lib/media/image/cache', () => ({
  moveIfNecessary: jest.fn((uri: string) => Promise.resolve(uri)),
}))

const opaquePng =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWNIqej5D8IMMAYAUsQJnR9BTBcAAAAASUVORK5CYII='
const transparentPng =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWNIqehpAGEGGAMAQ+IHobKi+cYAAAAASUVORK5CYII='
const image: ComposerImage = {
  alt: '',
  source: {
    id: 'source',
    path: 'source.webp',
    width: 6000,
    height: 3000,
    mime: 'image/webp',
  },
}
const pngImage: ComposerImage = {
  ...image,
  source: {...image.source, path: 'source.png', mime: 'image/png'},
}
const limits = {maxDimension: 4000, maxSize: 2000000}
const jpeg = {
  path: 'file://compressed.jpg',
  width: 4000,
  height: 2000,
  mime: 'image/jpeg',
  size: 1000,
}

/** Pad a valid fixture after IEND to simulate a larger encoder output. */
function pngWithSize(png: string, size: number) {
  const bytes = new Uint8Array(size)
  bytes.set(toByteArray(png))
  return fromByteArray(bytes)
}

function mockRenderer(png: (width: number) => string = () => opaquePng) {
  jest.mocked(renderImage).mockImplementation((_source, manipulate) => {
    let dimensions = {width: 0, height: 0}
    manipulate?.({
      resize: (value: typeof dimensions) => {
        dimensions = value
      },
    } as unknown as ImageManipulatorContext)
    return Promise.resolve({
      uri: `file://image-${jest.mocked(renderImage).mock.calls.length}`,
      ...dimensions,
      base64: png(dimensions.width),
    })
  })
}

function deletedPaths() {
  return jest.mocked(Paths.info).mock.calls.map(([path]) => path)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRenderer()
  jest.mocked(compressToFit).mockResolvedValue(jpeg)
})

it('keeps PNGs lossless when they fit, including exactly at the limit', async () => {
  expect(await compressImage(pngImage, limits)).toMatchObject({
    mime: 'image/png',
    width: 4000,
    height: 2000,
  })
  expect(await compressImage(pngImage, {...limits, maxSize: 95})).toMatchObject(
    {mime: 'image/png', size: 95},
  )
  expect(renderImage).toHaveBeenCalledTimes(2)
  expect(compressToFit).not.toHaveBeenCalled()
})

it('re-encodes oversized opaque PNGs as JPEG and deletes the PNG attempt', async () => {
  mockRenderer(() => pngWithSize(opaquePng, 2100000))
  expect(await compressImage(pngImage, limits)).toBe(jpeg)
  expect(compressToFit).toHaveBeenCalledWith(pngImage.source, limits)
  expect(deletedPaths()).toEqual(['file://image-1'])
})

it('keeps transparency from other formats as PNG', async () => {
  mockRenderer(() => transparentPng)
  expect(await compressImage(image, limits)).toMatchObject({
    mime: 'image/png',
    width: 4000,
    height: 2000,
  })
  expect(renderImage).toHaveBeenCalledTimes(1)
  expect(compressToFit).not.toHaveBeenCalled()
})

it('shrinks oversized PNGs without flattening their transparency', async () => {
  mockRenderer(width =>
    width > 3200 ? pngWithSize(transparentPng, 400) : transparentPng,
  )
  const result = await compressImage(image, {...limits, maxSize: 100})
  expect(result).toMatchObject({mime: 'image/png', width: 3200, height: 1600})
  expect(result.size).toBeLessThanOrEqual(100)
  expect(
    jest
      .mocked(renderImage)
      .mock.calls.every(([, , options]) => options?.format === SaveFormat.PNG),
  ).toBe(true)
  expect(deletedPaths()).toEqual(['file://image-1'])
})

it('sends JPEGs straight to the JPEG compressor', async () => {
  const jpegImage: ComposerImage = {
    ...image,
    source: {...image.source, mime: 'image/jpeg'},
  }
  expect(await compressImage(jpegImage, limits)).toBe(jpeg)
  expect(renderImage).not.toHaveBeenCalled()
})

it('uses the cropped source and never upscales', async () => {
  const transformed = {
    path: 'crop.png',
    width: 100,
    height: 50,
    mime: 'image/png',
  }
  expect(await compressImage({...image, transformed}, limits)).toMatchObject({
    width: 100,
    height: 50,
  })
  expect(jest.mocked(renderImage).mock.calls[0][0]).toBe('crop.png')
})

it('rejects a failed base64 export and cleans up the output', async () => {
  jest
    .mocked(renderImage)
    .mockResolvedValueOnce({uri: 'file://failed', width: 4000, height: 2000})
  await expect(compressImage(image, limits)).rejects.toThrow(
    'Unable to compress image',
  )
  expect(deletedPaths()).toEqual(['file://failed'])
})

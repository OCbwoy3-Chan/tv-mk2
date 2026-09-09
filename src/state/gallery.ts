import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  makeDirectoryAsync,
  moveAsync,
} from 'expo-file-system/legacy'
import {type ImageManipulatorContext, SaveFormat} from 'expo-image-manipulator'
import {type BlobRef} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {renderImage} from '#/lib/media/image-manipulator'
import {getImageDim} from '#/lib/media/manip'
import {openCropper} from '#/lib/media/picker'
import {type PickerImage} from '#/lib/media/picker.shared'
import {getDataUriSize} from '#/lib/media/util'
import {isCancelledError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {IS_NATIVE, IS_WEB} from '#/env'

export type ImageTransformation = {
  crop?: Parameters<ImageManipulatorContext['crop']>[0]
}

export type ImageMeta = {
  path: string
  width: number
  height: number
  mime: string
}

export type ImageSource = ImageMeta & {
  id: string
}

type ComposerImageBase = {
  alt: string
  source: ImageSource
  blobRef?: BlobRef
  /** Original localRef path from draft, if editing an existing draft. Used to reuse the same storage key. */
  localRefPath?: string
}
type ComposerImageWithoutTransformation = ComposerImageBase & {
  transformed?: undefined
  manips?: undefined
}
type ComposerImageWithTransformation = ComposerImageBase & {
  transformed: ImageMeta
  manips?: ImageTransformation
}

export type ComposerImage =
  ComposerImageWithoutTransformation | ComposerImageWithTransformation

let _imageCacheDirectory: string

function getImageCacheDirectory(): string | null {
  if (IS_NATIVE) {
    return (_imageCacheDirectory ??= joinPath(cacheDirectory!, 'bsky-composer'))
  }

  return null
}

export async function createComposerImage(
  raw: ImageMeta,
): Promise<ComposerImageWithoutTransformation> {
  return {
    alt: '',
    source: {
      id: nanoid(),
      // Copy to cache to ensure file survives OS temporary file cleanup
      path: await copyToCache(raw.path),
      width: raw.width,
      height: raw.height,
      mime: raw.mime,
    },
  }
}

export type InitialImage = {
  uri: string
  width: number
  height: number
  altText?: string
  blobRef?: BlobRef
}

export function createInitialImages(
  uris: InitialImage[] = [],
): ComposerImageWithoutTransformation[] {
  return uris.map(({uri, width, height, altText = '', blobRef}) => {
    return {
      alt: altText,
      source: {
        id: nanoid(),
        path: uri,
        width: width,
        height: height,
        mime: 'image/jpeg',
      },
      blobRef,
    }
  })
}

export async function pasteImage(
  uri: string,
): Promise<ComposerImageWithoutTransformation> {
  const {width, height} = await getImageDim(uri)
  const match = /^data:(.+?);/.exec(uri)

  return {
    alt: '',
    source: {
      id: nanoid(),
      path: uri,
      width: width,
      height: height,
      mime: match ? match[1] : 'image/jpeg',
    },
  }
}

export async function cropImage(img: ComposerImage): Promise<ComposerImage> {
  if (!IS_NATIVE) {
    return img
  }

  const source = img.source

  // @todo: we're always passing the original image here, does image-cropper
  // allows for setting initial crop dimensions? -mary
  try {
    const cropped = await openCropper({
      imageUri: source.path,
    })

    return {
      alt: img.alt,
      source: source,
      transformed: {
        path: await moveIfNecessary(cropped.path),
        width: cropped.width,
        height: cropped.height,
        mime: cropped.mime,
      },
    }
  } catch (e) {
    if (!isCancelledError(e)) {
      logger.error('Failed to crop image', {safeMessage: e})
      return img
    }

    throw e
  }
}

export async function manipulateImage(
  img: ComposerImage,
  trans: ImageTransformation,
): Promise<ComposerImage> {
  const crop = trans.crop
  if (!crop) {
    if (img.transformed === undefined) {
      return img
    }

    return {alt: img.alt, source: img.source}
  }

  const source = img.source
  const result = await renderImage(source.path, context => context.crop(crop), {
    format: SaveFormat.PNG,
  })

  return {
    alt: img.alt,
    source: img.source,
    transformed: {
      path: await moveIfNecessary(result.uri),
      width: result.width,
      height: result.height,
      mime: 'image/png',
    },
    manips: trans,
  }
}

export function resetImageManipulation(
  img: ComposerImage,
): ComposerImageWithoutTransformation {
  if (img.transformed !== undefined) {
    return {alt: img.alt, source: img.source}
  }

  return img
}

export async function compressImage(
  img: ComposerImage,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  const source = img.transformed || img.source
  let currentDimension = Math.min(
    maxDimension,
    Math.max(source.width, source.height),
  )

  // PNG is lossless: changing JPEG quality does not reduce its size. Keep
  // upstream's resize/render flow, reducing dimensions until the PNG fits.
  while (currentDimension >= 1) {
    const [w, h] = containImageRes(
      source.width,
      source.height,
      currentDimension,
    ).map(dimension => Math.max(1, dimension))

    const res = await renderImage(
      source.path,
      context => context.resize({width: w, height: h}),
      {
        compress: 1,
        format: SaveFormat.PNG,
        base64: true,
      },
    )

    const base64 = res.base64
    const size = base64 ? getDataUriSize(base64) : 0
    if (base64 && size <= maxSize) {
      return {
        path: await moveIfNecessary(res.uri),
        width: res.width,
        height: res.height,
        mime: 'image/png',
        size,
      }
    }

    if (!base64 || (w === 1 && h === 1)) break
    currentDimension = Math.max(1, Math.floor(Math.max(w, h) * 0.8))
  }

  throw new Error(`Unable to compress image`)
}

async function moveIfNecessary(from: string) {
  const cacheDir = IS_NATIVE && getImageCacheDirectory()

  if (cacheDir && !from.startsWith(cacheDir)) {
    const to = joinPath(cacheDir, nanoid(36))

    await makeDirectoryAsync(cacheDir, {intermediates: true})
    await moveAsync({from, to})

    return to
  }

  return from
}

/**
 * Copy a file from a potentially temporary location to our cache directory.
 * This ensures picker files are available for draft saving even if the original
 * temporary files are cleaned up by the OS.
 *
 * On web, converts blob URLs to data URIs immediately to prevent revocation issues.
 */
async function copyToCache(from: string): Promise<string> {
  // Data URIs don't need any conversion
  if (from.startsWith('data:')) {
    return from
  }

  if (IS_WEB) {
    // Web: convert blob URLs to data URIs before they can be revoked
    if (from.startsWith('blob:')) {
      try {
        const response = await fetch(from)
        const blob = await response.blob()
        return await blobToDataUri(blob)
      } catch (e) {
        // Blob URL was likely revoked, return as-is for downstream error handling
        return from
      }
    }
    // Other URLs on web don't need conversion
    return from
  }

  // Native: copy to cache directory to survive OS temp file cleanup
  const cacheDir = getImageCacheDirectory()
  if (!cacheDir || from.startsWith(cacheDir)) {
    return from
  }

  const to = joinPath(cacheDir, nanoid(36))
  await makeDirectoryAsync(cacheDir, {intermediates: true})

  let normalizedFrom = from
  if (!from.startsWith('file://') && from.startsWith('/')) {
    normalizedFrom = `file://${from}`
  }

  await copyAsync({from: normalizedFrom, to})
  return to
}

/**
 * Convert a Blob to a data URI
 */
function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to data URI'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Caches that the OS image picker and manipulator write into when attaching
 * media to a post. They live alongside our own `bsky-composer` dir under the OS
 * cache directory. expo-image-picker copies every originally selected photo and
 * video here, and expo-image-manipulator leaves intermediate full-resolution
 * outputs here (compressImage makes several rendering passes, only the last of
 * which gets moved into `bsky-composer`). Nothing else cleans these up,
 * so on iOS - where the OS exposes no "clear cache" - they accumulate
 * indefinitely, one full-resolution copy per attached item.
 */
const SYSTEM_MEDIA_CACHE_DIRS = ['ImagePicker', 'ImageManipulator']

/** Purge files that were created to accomodate image manipulation */
export async function purgeTemporaryImageFiles() {
  if (!IS_NATIVE) {
    return
  }

  const cacheDir = getImageCacheDirectory()
  if (cacheDir) {
    await deleteAsync(cacheDir, {idempotent: true})
    await makeDirectoryAsync(cacheDir)
  }

  // We don't recreate these - the respective expo modules recreate them on
  // demand the next time they run.
  await Promise.all(
    SYSTEM_MEDIA_CACHE_DIRS.map(dir =>
      deleteAsync(joinPath(cacheDirectory!, dir), {idempotent: true}),
    ),
  )
}

function joinPath(a: string, b: string) {
  if (a.endsWith('/')) {
    if (b.startsWith('/')) {
      return a.slice(0, -1) + b
    }
    return a + b
  } else if (b.startsWith('/')) {
    return a + b
  }
  return a + '/' + b
}

function containImageRes(
  w: number,
  h: number,
  max: number,
): [width: number, height: number] {
  let scale = 1

  if (w > max || h > max) {
    scale = w > h ? max / w : max / h
    w = Math.floor(w * scale)
    h = Math.floor(h * scale)
  }

  return [w, h]
}

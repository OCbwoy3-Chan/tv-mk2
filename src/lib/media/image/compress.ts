import {File, Paths} from 'expo-file-system'
import {type ImageResult, SaveFormat} from 'expo-image-manipulator'
import {byteLength} from 'base64-js'

import {createLimit} from '#/lib/async/limit'
import {moveIfNecessary} from '#/lib/media/image/cache'
import {compressToFit} from '#/lib/media/image/compressToFit'
import {renderedPngHasTransparency} from '#/lib/media/image/transparency'
import {renderImage} from '#/lib/media/image-manipulator'
import {type PickerImage} from '#/lib/media/picker.shared'
import {type ComposerImage, type ImageMeta} from '#/state/gallery'
import {IS_NATIVE} from '#/env'

/*
 * Each image being compressed holds at least one full-size decoded bitmap
 * (about 48 MB for a 12 MP photo), so compressing a 10-image gallery all at
 * once is enough to get the app killed for memory (APP-3190).
 */
const MAX_CONCURRENT_COMPRESSIONS = 2
const limit = createLimit(MAX_CONCURRENT_COMPRESSIONS)

/**
 * Compresses an image to fit within `maxDimension` and `maxSize`. At most
 * {@link MAX_CONCURRENT_COMPRESSIONS} images are compressed at once across the
 * app, so callers can start them all in parallel.
 */
export function compressImage(
  img: ComposerImage,
  opts: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  return limit(() => compressImageSource(img.transformed || img.source, opts))
}

/**
 * Share the same format selection and byte limits across image upload paths.
 * PNGs that already fit, and images with transparency, stay PNG; everything
 * else is re-encoded as a JPEG by `compressToFit`.
 */
export async function compressImageSource(
  source: ImageMeta,
  opts: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  return (await compressAsPng(source, opts)) ?? compressToFit(source, opts)
}

/**
 * Returns a PNG when the image should keep its lossless format, or undefined
 * when a JPEG is fine. JPEG sources can't carry transparency, so they skip the
 * PNG render entirely.
 */
async function compressAsPng(
  source: ImageMeta,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage | undefined> {
  const mime = source.mime.toLowerCase().split(';')[0].trim()
  if (mime === 'image/jpeg' || mime === 'image/jpg') return

  let currentDimension = Math.min(
    maxDimension,
    Math.max(source.width, source.height),
  )
  const intermediateUris: string[] = []
  let selectedUri: string | undefined

  async function render() {
    const [width, height] = containImageRes(
      source.width,
      source.height,
      currentDimension,
    )
    const result = await renderImage(
      source.path,
      context => context.resize({width, height}),
      {compress: 1, format: SaveFormat.PNG, base64: true},
    )
    intermediateUris.push(result.uri)
    if (!result.base64) throw new Error('Unable to compress image')
    return result
  }

  function fits(result: ImageResult) {
    return byteLength(result.base64!) <= maxSize
  }

  try {
    let result = await render()
    const keepPng =
      (mime === 'image/png' && fits(result)) ||
      renderedPngHasTransparency(result.base64!)
    if (!keepPng) return

    // PNG quality is fixed; only reduce dimensions when it exceeds the limit.
    while (!fits(result)) {
      if (currentDimension <= 1) throw new Error('Unable to compress image')
      currentDimension = Math.max(1, Math.floor(currentDimension * 0.8))
      result = await render()
    }

    const path = await moveIfNecessary(result.uri)
    selectedUri = result.uri
    return {
      path,
      width: result.width,
      height: result.height,
      mime: 'image/png',
      size: byteLength(result.base64!),
    }
  } finally {
    for (const uri of intermediateUris) {
      if (uri !== selectedUri) deleteIntermediate(uri)
    }
  }
}

/** Cache cleanup must not hide a compression or upload error. */
function deleteIntermediate(uri: string) {
  try {
    if (IS_NATIVE) {
      if (Paths.info(uri).exists) new File(uri).delete()
    } else if (uri.startsWith('blob:')) {
      URL.revokeObjectURL(uri)
    }
  } catch {}
}

function containImageRes(
  w: number,
  h: number,
  max: number,
): [width: number, height: number] {
  const scale = Math.min(1, max / Math.max(w, h))
  return [
    Math.max(1, Math.floor(w * scale)),
    Math.max(1, Math.floor(h * scale)),
  ]
}

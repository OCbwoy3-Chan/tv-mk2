import {POST_IMG_MAX} from '#/lib/constants'
import {formatToFileExt} from '#/lib/media/image-formats'
import {type PickerImage} from './picker.shared'
import {type Dimensions} from './types'
import {blobToDataUri, getDataUriSize, getDownloadImageUri} from './util'
import {mimeToExt} from './video/util'

export async function compressIfNeeded(
  img: PickerImage,
  maxSize: number = POST_IMG_MAX.size,
  opts?: {outputMime?: 'image/jpeg' | 'image/webp'; forceEncode?: boolean},
): Promise<PickerImage> {
  const outputMime = opts?.outputMime ?? 'image/jpeg'
  const needsReencode =
    opts?.forceEncode || img.size >= maxSize || img.mime !== outputMime

  if (!needsReencode) {
    return img
  }

  return await doResize(img.path, {
    width: img.width,
    height: img.height,
    mode: 'stretch',
    maxSize,
    outputMime: opts?.outputMime ?? 'image/jpeg',
  })
}

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), opts.timeout || 5e3)
  const res = await fetch(opts.uri)
  const resBody = await res.blob()
  clearTimeout(to)

  const dataUri = await blobToDataUri(resBody)
  return await doResize(dataUri, opts)
}

export async function shareImageModal(_opts: {uri: string}) {
  // TODO
  throw new Error('TODO')
}

/**
 * Saves an image to the user's device. Uses the CDN's `download` preset with the
 * chosen format suffix. On web this triggers a browser download via a temporary
 * anchor — no fetch needed.
 */
export async function saveImageToMediaLibrary({
  uri,
  format = 'jpeg',
}: {
  uri: string
  format?: string
}) {
  const downloadUri = getDownloadImageUri(uri, format)
  const segments = downloadUri.split('/')
  const filename = `bluesky-${segments.at(-1) ?? 'image'}.${formatToFileExt(format)}`
  downloadUrl(downloadUri, filename)
}

export async function downloadVideoWeb({uri}: {uri: string}) {
  // download the file to cache
  const downloadResponse = await fetch(uri)
    .then(res => res.blob())
    .catch(() => null)
  if (downloadResponse == null) return false
  const extension = mimeToExt(downloadResponse.type)

  const blobUrl = URL.createObjectURL(downloadResponse)
  const link = document.createElement('a')
  link.setAttribute('download', uri.slice(-10) + '.' + extension)
  link.setAttribute('href', blobUrl)
  link.click()
  return true
}

export async function getImageDim(path: string): Promise<Dimensions> {
  var img = document.createElement('img')
  const promise = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })
  img.src = path
  await promise
  return {width: img.width, height: img.height}
}

// internal methods
// =

interface DoResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  outputMime?: 'image/jpeg' | 'image/webp'
}

async function doResize(
  dataUri: string,
  opts: DoResizeOpts,
): Promise<PickerImage> {
  const outputMime = opts.outputMime ?? 'image/webp'
  let newDataUri

  let minQualityPercentage = 0
  let maxQualityPercentage = 101 //exclusive

  while (maxQualityPercentage - minQualityPercentage > 1) {
    const qualityPercentage = Math.round(
      (maxQualityPercentage + minQualityPercentage) / 2,
    )
    const tempDataUri = await createResizedImage(dataUri, {
      width: opts.width,
      height: opts.height,
      quality: qualityPercentage / 100,
      mode: opts.mode,
      outputMime,
    })

    if (getDataUriSize(tempDataUri) < opts.maxSize) {
      minQualityPercentage = qualityPercentage
      newDataUri = tempDataUri
    } else {
      maxQualityPercentage = qualityPercentage
    }
  }

  if (!newDataUri) {
    throw new Error('Failed to compress image')
  }
  return {
    path: newDataUri,
    mime: outputMime,
    size: getDataUriSize(newDataUri),
    width: opts.width,
    height: opts.height,
  }
}

function createResizedImage(
  dataUri: string,
  {
    width,
    height,
    quality,
    mode,
    outputMime,
  }: {
    width: number
    height: number
    quality: number
    mode: 'contain' | 'cover' | 'stretch'
    outputMime: 'image/jpeg' | 'image/webp'
  },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return reject(new Error('Failed to resize image'))
      }

      let scale = 1
      if (mode === 'cover') {
        scale = img.width < img.height ? width / img.width : height / img.height
      } else if (mode === 'contain') {
        scale = img.width > img.height ? width / img.width : height / img.height
      }
      let w = img.width * scale
      let h = img.height * scale

      canvas.width = w
      canvas.height = h

      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL(outputMime, quality))
    })
    img.addEventListener('error', ev => {
      reject(ev.error)
    })
    img.src = dataUri
  })
}

export async function saveBytesToDisk(
  filename: string,
  bytes: Uint8Array<ArrayBuffer>,
  type: string,
) {
  const blob = new Blob([bytes], {type})
  const url = URL.createObjectURL(blob)
  downloadUrl(url, filename)
  // Firefox requires a small delay
  setTimeout(() => URL.revokeObjectURL(url), 100)
  return true
}

function downloadUrl(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function safeDeleteAsync() {
  // no-op
}

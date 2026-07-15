export function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}

export function getResizedDimensions(
  originalDims: {
    width: number
    height: number
  },
  maxDimension: number,
) {
  if (
    originalDims.width <= maxDimension &&
    originalDims.height <= maxDimension
  ) {
    return originalDims
  }

  const ratio = Math.min(
    maxDimension / originalDims.width,
    maxDimension / originalDims.height,
  )

  return {
    width: Math.round(originalDims.width * ratio),
    height: Math.round(originalDims.height * ratio),
  }
}

// Fairly accurate estimate that is more performant
// than decoding and checking length of URI
export function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4)
}

export function isUriImage(uri: string): boolean {
  return /\.(jpg|jpeg|png|webp).*$/.test(uri)
}

/**
 * HEIC/HEIF sources often produce broken or washed-out WebP via
 * expo-image-manipulator (HDR / wide-gamut color spaces). Prefer JPEG.
 */
export function isHeicFamilyMime(mime: string | undefined | null): boolean {
  if (!mime) return false
  switch (mime.toLowerCase()) {
    case 'image/heic':
    case 'image/heif':
    case 'image/heic-sequence':
    case 'image/heif-sequence':
      return true
    default:
      return false
  }
}

/*
 * Safari / iOS WebKit cannot encode WebP from canvas (`toDataURL` /
 * `toBlob`). Requesting `image/webp` silently returns PNG, quality is
 * ignored, and our size binary-search never converges →
 * "Unable to compress image". Detect real encode support once.
 */
let webpEncodeSupported: boolean | undefined

function detectWebpEncodeSupport(): boolean {
  if (typeof document === 'undefined') {
    // Native: expo-image-manipulator encodes WebP without canvas.
    return true
  }
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

/**
 * Whether this environment can lossily encode WebP (canvas on web, native
 * manipulator otherwise). Cached after first check.
 */
export function canEncodeWebp(): boolean {
  if (webpEncodeSupported === undefined) {
    webpEncodeSupported = detectWebpEncodeSupport()
  }
  return webpEncodeSupported
}

/**
 * Test-only: override / reset cached WebP encode capability.
 */
export function setWebpEncodeSupportForTests(value: boolean | undefined) {
  webpEncodeSupported = value
}

/**
 * Pick the upload encode mime. Forces JPEG for HEIC-family inputs and when
 * the environment cannot encode WebP (Safari / iOS web).
 */
export function resolveUploadImageMime(
  sourceMime: string | undefined | null,
  requested: 'image/jpeg' | 'image/webp' = 'image/webp',
): 'image/jpeg' | 'image/webp' {
  if (isHeicFamilyMime(sourceMime)) {
    return 'image/jpeg'
  }
  if (requested === 'image/webp' && !canEncodeWebp()) {
    return 'image/jpeg'
  }
  return requested
}

export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export type ImgproxyPreset =
  | 'default'
  | 'avatar_thumbnail'
  | 'avatar'
  | 'banner'
  | 'feed_fullsize'
  | 'feed_thumbnail'
  | 'download'

// Using capturing groups here instead of lookbehinds in order to support older versions of Safari.
// https://bugs.webkit.org/show_bug.cgi?id=174931
const IMGPROXY_PRESET_RE =
  /(\/img\/)(default|avatar_thumbnail|avatar|banner|feed_fullsize|feed_thumbnail|download)(\/)/

/**
 * Replaces any imgproxy preset in a CDN URI with the given preset.
 */
export function convertCdnPreset(uri: string, preset: ImgproxyPreset): string {
  return uri.replace(IMGPROXY_PRESET_RE, `$1${preset}$3`)
}

export function modifyImageFormat(uri: string, format: string) {
  const atPosition = uri.lastIndexOf('@')
  return atPosition === -1
    ? `${uri}@${format}`
    : uri.slice(0, atPosition + 1) + format
}

export function getDownloadImageUri(uri: string, format: string) {
  return modifyImageFormat(convertCdnPreset(uri, 'download'), format)
}

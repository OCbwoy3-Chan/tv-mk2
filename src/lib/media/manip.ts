import {Image as RNImage} from 'react-native'
import uuid from 'react-native-uuid'
import {Directory, EncodingType, File, Paths} from 'expo-file-system'
import {SaveFormat} from 'expo-image-manipulator'
import * as Sharing from 'expo-sharing'

import {getMediaDownloadFilename} from '#/lib/media/downloadFilename'
import {compressImageSource} from '#/lib/media/image/compress'
import {formatToFileExt, imageMimeToExtension} from '#/lib/media/image-formats'
import {getDownloadImageUri} from '#/lib/media/original-image'
import {isCancelledError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {IS_ANDROID, IS_IOS} from '#/env'
import {renderImage} from './image-manipulator'
import {Album, Asset, requestPermissionsAsync} from './media-library'
import {type PickerImage} from './picker.shared'
import {type Dimensions} from './types'
import {mimeToExt} from './video/util'

export async function compressIfNeeded(
  img: PickerImage,
  {maxDimension, maxSize}: {maxDimension: number; maxSize: number},
): Promise<PickerImage> {
  if (
    img.size <= maxSize &&
    img.width <= maxDimension &&
    img.height <= maxDimension
  ) {
    return img
  }
  const resizedImage = await doResize(
    normalizePath(img.path),
    {
      maxDimension,
      maxSize,
    },
    img.mime,
  )
  const finalImageMovedPath = await moveToPermanentPath(
    resizedImage.path,
    `.${imageMimeToExtension(resizedImage.mime) ?? 'jpg'}`,
  )
  const finalImg = {
    ...resizedImage,
    path: finalImageMovedPath,
  }
  return finalImg
}

export interface DownloadAndResizeOpts {
  uri: string
  maxDimension: number
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  try {
    new URL(opts.uri)
  } catch (e: any) {
    console.error('Invalid URI', opts.uri, e)
    return
  }

  const path = await downloadImage(opts.uri, String(uuid.v4()), opts.timeout)

  try {
    return await doResize(path, {
      maxDimension: opts.maxDimension,
      maxSize: opts.maxSize,
    })
  } finally {
    safeDelete(path)
  }
}

export async function shareImageModal({uri}: {uri: string}) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }

  const shareDirectory = prepareShareDirectory()
  const downloadedPath = await downloadImage(uri, String(uuid.v4()), 15e3)
  let jpegUri: string | undefined
  let imagePath: string | undefined
  let didShare = false

  try {
    const jpeg = await renderImage(downloadedPath, undefined, {
      format: SaveFormat.JPEG,
      compress: 1.0,
    })
    jpegUri = jpeg.uri
    imagePath = await moveToPermanentPath(jpegUri, '.jpg', {
      directory: shareDirectory,
    })
    await Sharing.shareAsync(imagePath, {
      mimeType: 'image/jpeg',
      UTI: 'image/jpeg',
    })
    didShare = true
  } finally {
    safeDelete(downloadedPath)
    if (jpegUri) safeDelete(jpegUri)
    if (imagePath && !didShare) safeDelete(imagePath)
  }
}

const ALBUM_NAME = 'Witchsky'

/**
 * Saves original bytes from the image owner's PDS, or the CDN's `download`
 * preset for converted formats, to the user's media library.
 */
export async function saveImageToMediaLibrary({
  uri,
  format = 'original',
  downloadName,
}: {
  uri: string
  format?: string
  downloadName?: string
}) {
  const downloadUri = await getDownloadImageUri(uri, format)
  const downloadedPath = await downloadImage(
    downloadUri,
    String(uuid.v4()),
    20e3,
  )
  const downloadedExt = downloadedPath.slice(downloadedPath.lastIndexOf('.'))
  const ext =
    downloadedExt !== '.bin'
      ? downloadedExt
      : `.${format === 'original' ? 'jpg' : formatToFileExt(format)}`
  const imagePath = await moveToPermanentPath(downloadedPath, ext, {
    filename: getMediaDownloadFilename({
      downloadName,
      uri,
      extension: ext.slice(1),
      kind: 'image',
    }),
  })

  // save
  try {
    if (IS_ANDROID) {
      /*
       * Create from the local file each time so the MIME type determines the
       * parent directory, even when Pictures and Movies have identically named
       * albums. Looking up an album by name could select the wrong parent.
       */
      await Album.create(ALBUM_NAME, [imagePath])
    } else {
      await Asset.create(imagePath)
    }
  } catch (err) {
    logger.error(err instanceof Error ? err : String(err), {
      message: 'Failed to save image to media library',
    })
    throw err
  } finally {
    safeDelete(imagePath.slice(0, imagePath.lastIndexOf('/')))
  }
}

export async function saveVideoToMediaLibrary({
  uri,
  downloadName,
}: {
  uri: string
  downloadName?: string
}) {
  if (IS_IOS) {
    // Asset.create requires permission to be granted before it is called.
    const permission = await requestPermissionsAsync(true)
    if (!permission.granted) return false
  }

  const downloaded = await downloadToCache(uri, String(uuid.v4())).catch(
    () => null,
  )
  if (!downloaded) return false

  let extension: string
  try {
    extension = mimeToExt(downloaded.mime ?? '')
  } catch {
    safeDelete(downloaded.uri)
    return false
  }

  const videoPath = await moveToPermanentPath(downloaded.uri, '.' + extension, {
    filename: getMediaDownloadFilename({
      downloadName,
      uri,
      extension,
      kind: 'video',
    }),
  })

  // save
  try {
    if (IS_ANDROID) {
      await Album.create(ALBUM_NAME, [videoPath])
    } else {
      await Asset.create(videoPath)
    }
  } catch (err) {
    logger.error(err instanceof Error ? err : String(err), {
      message: 'Failed to save video to media library',
    })
    throw err
  } finally {
    safeDelete(videoPath.slice(0, videoPath.lastIndexOf('/')))
  }
  return true
}

export function getImageDim(path: string): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      path,
      (width, height) => {
        resolve({width, height})
      },
      reject,
    )
  })
}

// internal methods
// =

interface DoResizeOpts {
  maxDimension: number
  maxSize: number
}

async function doResize(
  localUri: string,
  opts: DoResizeOpts,
  mime = mimeFromPath(localUri),
): Promise<PickerImage> {
  // Performing an "empty" manipulation gets the dimensions of the original image.
  const imageRes = await renderImage(localUri)
  try {
    return await compressImageSource(
      {
        path: localUri,
        width: imageRes.width,
        height: imageRes.height,
        mime,
      },
      opts,
    )
  } finally {
    safeDelete(imageRes.uri)
  }
}

function mimeFromPath(path: string) {
  if (/\.png$/i.test(path)) return 'image/png'
  if (/\.jpe?g$/i.test(path)) return 'image/jpeg'
  return ''
}

async function moveToPermanentPath(
  path: string,
  ext: string,
  {
    directory = Paths.cache,
    filename,
  }: {
    directory?: Directory
    /**
     * Gives the file this name inside its own staging directory, so repeated
     * names never collide. Delete the parent directory when done.
     */
    filename?: string
  } = {},
): Promise<string> {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const id = String(uuid.v4())

  let destination: File
  if (filename) {
    const stagingDirectory = new Directory(directory, id)
    stagingDirectory.create({intermediates: true})
    destination = new File(stagingDirectory, filename)
    try {
      await new File(normalizePath(path)).copy(destination)
    } catch (error) {
      safeDelete(stagingDirectory.uri)
      throw error
    }
  } else {
    destination = new File(directory, id + ext)
    await new File(normalizePath(path)).copy(destination)
  }
  safeDelete(path)
  return normalizePath(destination.uri)
}

function prepareShareDirectory(): Directory {
  const directory = new Directory(Paths.cache, 'bsky-share')

  /*
   * Keep the current file alive after the share sheet closes because Android
   * targets may consume its content URI lazily. Remove the previous share the
   * next time a share starts so the cache remains bounded.
   */
  if (directory.exists) {
    for (const entry of directory.list()) {
      safeDelete(entry.uri)
    }
  } else {
    directory.create({intermediates: true})
  }
  return directory
}

export function safeDelete(path: string) {
  const normalizedPath = normalizePath(path)
  try {
    const info = Paths.info(normalizedPath)
    if (info.isDirectory) {
      new Directory(normalizedPath).delete()
    } else if (info.exists) {
      new File(normalizedPath).delete()
    }
  } catch (e) {
    console.error('Failed to delete file', e)
  }
}

function normalizePath(str: string): string {
  if (str.startsWith('/')) {
    return `file://${str}`
  }
  return str
}

export async function saveBytesToDisk(
  filename: string,
  bytes: Uint8Array,
  type: string,
) {
  // ideally we'd use `bytes.toBase64()`, but that's only baseline newly available
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  const encoded = btoa(binary)
  return await saveToDevice(filename, encoded, type)
}

export async function saveToDevice(
  filename: string,
  encoded: string,
  type: string,
) {
  try {
    if (IS_IOS) {
      await withTempFile(filename, encoded, async tmpFileUrl => {
        await Sharing.shareAsync(tmpFileUrl, {UTI: type})
      })
      return true
    } else {
      const directory = await Directory.pickDirectoryAsync()
      const file = directory.createFile(filename, type)
      await file.write(encoded, {
        encoding: EncodingType.Base64,
      })
      return true
    }
  } catch (e) {
    if (isCancelledError(e)) {
      return false
    }
    logger.error('Error occurred while saving file', {message: e})
    return false
  }
}

async function withTempFile<T>(
  filename: string,
  encoded: string,
  cb: (url: string) => T | Promise<T>,
): Promise<T> {
  // Using a directory so that the file name is not a random string
  const tmpDir = new Directory(Paths.cache, String(uuid.v4()))
  tmpDir.create({intermediates: true})

  try {
    const tmpFile = new File(tmpDir, filename)
    await tmpFile.write(encoded, {
      encoding: EncodingType.Base64,
    })

    return await cb(tmpFile.uri)
  } finally {
    safeDelete(tmpDir.uri)
  }
}

async function downloadImage(uri: string, destName: string, timeout: number) {
  const downloaded = await downloadToCache(uri, destName, timeout)
  const ext = imageMimeToExtension(downloaded.mime)
  const destination = new File(
    Paths.cache,
    ext ? `${destName}.${ext}` : `${destName}.bin`,
  )
  try {
    await new File(downloaded.uri).move(destination)
  } catch (err) {
    safeDelete(downloaded.uri)
    throw err
  }
  return normalizePath(destination.uri)
}

/**
 * Downloads into the cache and reports the file's MIME type. Expo derives the
 * filename, and so the type, from the response headers; PDS `getBlob` URLs
 * can defeat that on Android, so fall back to sniffing the file's first bytes.
 */
async function downloadToCache(
  uri: string,
  destName: string,
  timeout?: number,
) {
  /*
   * Download into a temporary directory so Expo can derive a filename from
   * the response headers. We then use that file's MIME type to choose the
   * permanent extension.
   */
  const tempDir = new Directory(Paths.cache, `${destName}-download`)
  tempDir.create({intermediates: true})

  const controller = new AbortController()
  let timedOut = false
  const timeoutId =
    timeout === undefined
      ? undefined
      : setTimeout(() => {
          timedOut = true
          controller.abort()
        }, timeout)

  try {
    const downloaded = await File.downloadFileAsync(uri, tempDir, {
      idempotent: true,
      signal: controller.signal,
    })
    const knownType =
      imageMimeToExtension(downloaded.type) || isVideoMime(downloaded.type)
    const mime = knownType ? downloaded.type : sniffMime(downloaded)
    const destination = new File(Paths.cache, `${destName}-download.bin`)
    await downloaded.move(destination)

    return {uri: normalizePath(destination.uri), mime}
  } catch (err) {
    if (timedOut) {
      throw new Error('Failed to download image - timed out')
    }

    throw err
  } finally {
    clearTimeout(timeoutId)
    safeDelete(tempDir.uri)
  }
}

function isVideoMime(mime: string | null | undefined) {
  try {
    mimeToExt(mime ?? '')
    return true
  } catch {
    return false
  }
}

/** Identifies the media formats we save from their magic numbers. */
function sniffMime(file: File): string | undefined {
  const bytes = readHeader(file)
  if (!bytes) return undefined
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end))
  const startsWith = (...signature: number[]) =>
    signature.every((byte, i) => bytes[i] === byte)

  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return 'image/png'
  if (ascii(0, 4) === 'GIF8') return 'image/gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (startsWith(0x1a, 0x45, 0xdf, 0xa3)) return 'video/webm'
  if (startsWith(0xff, 0x0a) || ascii(4, 8) === 'JXL ') return 'image/jxl'
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12)
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
    if (/^(heic|heix|heim|heis|hevc|hevx|mif1|msf1)$/.test(brand)) {
      return 'image/heic'
    }
    if (brand === 'qt  ') return 'video/quicktime'
    return 'video/mp4'
  }
  if (ascii(0, 2) === 'BM') return 'image/bmp'
  if (startsWith(0x00, 0x00, 0x01, 0x00)) return 'image/x-icon'
  return undefined
}

function readHeader(file: File): Uint8Array | undefined {
  try {
    const handle = file.open()
    try {
      return handle.readBytesSync(16)
    } finally {
      handle.close()
    }
  } catch {
    return undefined
  }
}

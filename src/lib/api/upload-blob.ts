import {
  cacheDirectory,
  copyAsync,
  EncodingType,
  writeAsStringAsync,
} from 'expo-file-system/legacy'
import {type AtpAgent, type ComAtprotoRepoUploadBlob} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {safeDeleteAsync} from '#/lib/media/manip'
import {IS_NATIVE} from '#/env'

/**
 * @param encoding Allows overriding the blob's type
 */
export async function uploadBlob(
  agent: AtpAgent,
  input: string | Blob,
  encoding?: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
  if (typeof input === 'string' && input.startsWith('file:')) {
    const blob = await asBlob(input)
    return agent.uploadBlob(blob, {encoding})
  }

  if (typeof input === 'string' && input.startsWith('/')) {
    const blob = await asBlob(`file://${input}`)
    return agent.uploadBlob(blob, {encoding})
  }

  if (typeof input === 'string' && input.startsWith('data:')) {
    const blob = IS_NATIVE
      ? await dataUriToBlobOnNative(input)
      : await dataUriToBlobViaFetch(input)
    return agent.uploadBlob(blob, {encoding})
  }

  if (input instanceof Blob) {
    return agent.uploadBlob(input, {encoding})
  }

  throw new TypeError(`Invalid uploadBlob input: ${typeof input}`)
}

async function asBlob(uri: string): Promise<Blob> {
  return withSafeFile(uri, async safeUri => {
    // Android does not support fetch() on file:// URIs; use XHR. RN sometimes
    // fires onerror or omits status even when the blob is readable, so we use
    // onloadend and only check the response.
    let xhrUrl = safeUri
    try {
      xhrUrl = decodeURI(safeUri)
    } catch {
      /* keep safeUri */
    }
    return await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.responseType = 'blob'
      xhr.onloadend = () => {
        const blob = xhr.response
        if (blob instanceof Blob && blob.size > 0) {
          resolve(blob)
        } else {
          // Message deliberately avoids substrings matched by isNetworkError()
          reject(new Error('Failed to read local image file for upload.'))
        }
      }
      xhr.open('GET', xhrUrl, true)
      xhr.send()
    })
  })
}

/**
 * RN fetch() on large data: URIs (e.g. full-screen PNG screenshots) often fails;
 * DCIM JPEGs more often use the file path after compression. Write to cache and
 * reuse XHR like other local files.
 */
async function dataUriToBlobOnNative(dataUri: string): Promise<Blob> {
  const comma = dataUri.indexOf(',')
  if (comma === -1 || !dataUri.startsWith('data:')) {
    throw new Error('Failed to read image data for upload.')
  }
  const header = dataUri.slice(5, comma)
  const payload = dataUri.slice(comma + 1)
  const isBase64 = /(^|;)\s*base64\s*(;|$)/i.test(header)
  if (!isBase64) {
    return dataUriToBlobViaFetch(dataUri)
  }
  const baseDir = cacheDirectory
  if (!baseDir) {
    return dataUriToBlobViaFetch(dataUri)
  }
  const tmpUri = joinPath(baseDir, `upload-blob-${nanoid()}.bin`)
  try {
    await writeAsStringAsync(tmpUri, payload, {
      encoding: EncodingType.Base64,
    })
    return await asBlob(tmpUri)
  } finally {
    await safeDeleteAsync(tmpUri)
  }
}

function joinPath(dir: string, name: string) {
  if (dir.endsWith('/')) {
    return name.startsWith('/') ? dir.slice(0, -1) + name : dir + name
  }
  return name.startsWith('/') ? dir + name : `${dir}/${name}`
}

async function dataUriToBlobViaFetch(dataUri: string): Promise<Blob> {
  try {
    const response = await fetch(dataUri)
    const blob = await response.blob()
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('empty')
    }
    return blob
  } catch {
    throw new Error('Failed to read image data for upload.')
  }
}

// HACK
// React native has a bug that inflates the size of jpegs on upload
// we get around that by renaming the file ext to .bin
// see https://github.com/facebook/react-native/issues/27099
// -prf
async function withSafeFile<T>(
  uri: string,
  fn: (path: string) => Promise<T>,
): Promise<T> {
  if (uri.endsWith('.jpeg') || uri.endsWith('.jpg')) {
    // Since we don't "own" the file, we should avoid renaming or modifying it.
    // Instead, let's copy it to a temporary file and use that (then remove the
    // temporary file).
    const newPath = uri.replace(/\.jpe?g$/, '.bin')
    try {
      await copyAsync({from: uri, to: newPath})
    } catch {
      // Failed to copy the file, just use the original
      return await fn(uri)
    }
    try {
      return await fn(newPath)
    } finally {
      // Remove the temporary file
      await safeDeleteAsync(newPath)
    }
  } else {
    return fn(uri)
  }
}

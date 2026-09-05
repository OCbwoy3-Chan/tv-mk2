import {
  ImageManipulator,
  type ImageManipulatorContext,
  type ImageResult,
  type SaveOptions,
} from 'expo-image-manipulator'

import {IS_WEB} from '#/env'
import {modifyImageFormat} from './util'

export async function renderImage(
  source: string,
  manipulate?: (context: ImageManipulatorContext) => void,
  saveOptions?: SaveOptions,
): Promise<ImageResult> {
  // Decode remote redraft images from a local blob to keep the canvas origin-clean.
  let localSource: string | undefined
  if (IS_WEB && /^https?:/.test(source)) {
    const response = await fetch(modifyImageFormat(source, 'original'))
    if (!response.ok)
      throw new Error(`Image download failed: ${response.status}`)
    localSource = URL.createObjectURL(await response.blob())
  }
  let context: ImageManipulatorContext | undefined
  try {
    context = ImageManipulator.manipulate(localSource ?? source)
    manipulate?.(context)
    const image = await context.renderAsync()

    try {
      return await image.saveAsync(saveOptions)
    } finally {
      image.release()
    }
  } finally {
    context?.release()
    if (localSource) URL.revokeObjectURL(localSource)
  }
}

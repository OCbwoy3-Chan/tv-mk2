import {PNG_IMG_MAX_SIZE} from '#/lib/constants'
import {modifyImageFormat} from '#/lib/media/util'

export function resolveEmbedImageUris(
  img: {
    thumb: string
    fullsize: string
    aspectRatio?: {width: number; height: number} | null
  },
  {
    thumbnailFormat,
    fullsizeFormat,
    loadAsPngs,
  }: {
    thumbnailFormat: string
    fullsizeFormat: string
    loadAsPngs: boolean
  },
) {
  const pngSized =
    loadAsPngs &&
    img.aspectRatio &&
    img.aspectRatio.width <= PNG_IMG_MAX_SIZE &&
    img.aspectRatio.height <= PNG_IMG_MAX_SIZE

  const resolvedFullsizeFormat =
    pngSized && fullsizeFormat === 'webp' ? 'png' : fullsizeFormat
  const fullsize = modifyImageFormat(img.fullsize, resolvedFullsizeFormat)
  const thumb = modifyImageFormat(img.thumb, thumbnailFormat)

  return {fullsize, thumb}
}

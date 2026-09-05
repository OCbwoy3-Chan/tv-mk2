import {IS_NATIVE} from '#/env'

export const IMAGE_FORMATS = [
  {label: 'Original', value: 'original'},
  {label: 'AVIF', value: 'avif'},
  {label: 'WebP', value: 'webp'},
  {label: 'JPEG', value: 'jpeg'},
  {label: 'PNG', value: 'png'},
  {label: 'GIF', value: 'gif'},
  {label: 'BMP', value: 'bmp'},
  {label: 'ICO', value: 'ico'},
  {label: 'JPEG XL', value: 'jxl'},
  ...(IS_NATIVE ? [{label: 'HEIC', value: 'heic'}] : []),
]

export function formatToFileExt(format: string) {
  if (format === 'jpeg') return 'jpg'
  return format
}

export function imageMimeToExtension(
  mime: string | undefined | null,
): string | undefined {
  const type = mime?.split(';')[0].trim().toLowerCase()
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/x-ms-bmp': 'bmp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/jxl': 'jxl',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/svg+xml': 'svg',
  }
  return type ? extensions[type] : undefined
}

import {Image, type ImageProps} from 'expo-image'

import {useTheme} from '#/alf'

export function InlineImage({
  size,
  loading = false,
  baselineOffset = size * 0.05,
  ...props
}: {
  size: number
  baselineOffset?: number
  loading?: boolean
} & Omit<ImageProps, 'style'>) {
  const t = useTheme()
  return (
    <Image
      {...props}
      style={{
        backgroundColor: loading ? t.palette.contrast_50 : undefined,
        borderRadius: loading ? 4 : 0,
        width: size,
        height: size,
        transform: [{translateY: baselineOffset}],
      }}
    />
  )
}

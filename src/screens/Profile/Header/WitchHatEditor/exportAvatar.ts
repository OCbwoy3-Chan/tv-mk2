import {type RefObject} from 'react'
import {type View} from 'react-native'
import {type Client} from '@atproto/lex'

import {compressImage, type ImageMeta} from '#/state/gallery'
import {
  AVATAR_SIZE,
  type HatPlacement,
} from '#/screens/Profile/Header/WitchHatEditor/utils'

export async function exportAvatar({
  previewRef,
}: {
  previewRef: RefObject<React.ElementRef<typeof View> | null>
  avatar: string
  placement: HatPlacement
  color: string
  pdsClient: Client
}): Promise<ImageMeta> {
  const {captureRef} = await import('react-native-view-shot')
  const path = await captureRef(previewRef, {
    format: 'png',
    result: 'tmpfile',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  })
  return compressImage(
    {
      alt: '',
      source: {
        id: 'witch-hat-avatar',
        path,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        mime: 'image/png',
      },
    },
    {maxDimension: AVATAR_SIZE, maxSize: 1_000_000},
  )
}

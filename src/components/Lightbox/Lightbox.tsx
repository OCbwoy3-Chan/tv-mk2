import {useCallback, useEffect} from 'react'
import {BackHandler} from 'react-native'

import {shareImageModal} from '#/lib/media/manip'
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import ImageView from '#/components/Lightbox/pager/ImagePager'
import {useLightbox, useLightboxControls} from '#/components/Lightbox/state'
import {IS_ANDROID} from '#/env'

export function Lightbox() {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()

  const onClose = useCallback(() => {
    closeLightbox()
  }, [closeLightbox])

  useEffect(() => {
    if (!IS_ANDROID || !activeLightbox) return

    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      closeLightbox()
      return true
    })
    return () => listener.remove()
  }, [activeLightbox, closeLightbox])

  const saveImageToAlbum = useSaveImageToMediaLibrary()

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onClose}
      onPressSave={(uri, format, downloadName) =>
        void saveImageToAlbum(uri, format, downloadName)
      }
      onPressShare={uri => void shareImageModal({uri})}
    />
  )
}

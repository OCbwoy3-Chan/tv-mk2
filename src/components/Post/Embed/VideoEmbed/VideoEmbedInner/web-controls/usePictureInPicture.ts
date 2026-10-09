import {useEffect, useState} from 'react'

/** Tracks browser-owned PiP state, including closing the floating window. */
export function usePictureInPicture() {
  const [element, setElement] = useState<Element | null>(null)

  useEffect(() => {
    const update = () => setElement(document.pictureInPictureElement ?? null)
    update()
    document.addEventListener('enterpictureinpicture', update, true)
    document.addEventListener('leavepictureinpicture', update, true)
    return () => {
      document.removeEventListener('enterpictureinpicture', update, true)
      document.removeEventListener('leavepictureinpicture', update, true)
    }
  }, [])

  return element
}

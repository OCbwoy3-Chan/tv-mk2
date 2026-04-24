import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['imageCdnHost']
type SetContext = (v: persisted.Schema['imageCdnHost']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.imageCdnHost,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['imageCdnHost']) => {},
)

const DEFAULT_IMAGE_CDN_ORIGIN = normalizeOrigin(
  persisted.defaults.imageCdnHost ?? '',
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('imageCdnHost'))

  const setStateWrapped = useCallback(
    (imageCdnHost: persisted.Schema['imageCdnHost']) => {
      setState(imageCdnHost)
      persisted.write('imageCdnHost', imageCdnHost)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('imageCdnHost', nextImageCdnHost => {
      setState(nextImageCdnHost)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useImageCdnHost() {
  return useContext(stateContext) ?? persisted.defaults.imageCdnHost!
}

export function useSetImageCdnHost() {
  return useContext(setContext)
}

function normalizeOrigin(input: string) {
  try {
    return new URL(input).origin
  } catch {
    return null
  }
}

function modifyImageCdnHost(src: string, imageCdnHost: string) {
  try {
    const srcUrl = new URL(src)
    if (srcUrl.protocol !== 'https:' && srcUrl.protocol !== 'http:') {
      return null
    }
    if (!srcUrl.pathname.startsWith('/img/')) {
      return null
    }

    const cdnUrl = new URL(imageCdnHost)
    srcUrl.protocol = cdnUrl.protocol
    srcUrl.hostname = cdnUrl.hostname
    srcUrl.port = cdnUrl.port

    return srcUrl.toString()
  } catch {
    return null
  }
}

export function maybeModifyImageCdnHost(src: string, imageCdnHost?: string) {
  if (!imageCdnHost) {
    return src
  }

  const nextOrigin = normalizeOrigin(imageCdnHost)
  if (!nextOrigin || nextOrigin === DEFAULT_IMAGE_CDN_ORIGIN) {
    return src
  }

  return modifyImageCdnHost(src, nextOrigin) ?? src
}

/**
 * Combined image transformation pipeline: applies high-quality image format
 * transformation first (on original CDN), then applies CDN host rewrite.
 */
export function applyImageTransforms(
  src: string,
  options: {
    imageCdnHost?: string
    highQualityImages?: boolean
  },
) {
  // Import is deferred to avoid circular dependency
  const {maybeModifyHighQualityImage} =
    require('./high-quality-images') as typeof import('./high-quality-images')

  // First apply quality transformation on original CDN
  const withQuality = maybeModifyHighQualityImage(
    src,
    options.highQualityImages,
  )
  // Then apply CDN host replacement
  return maybeModifyImageCdnHost(withQuality, options.imageCdnHost)
}

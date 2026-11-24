import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {Image, type ImageProps} from 'expo-image'

import {useTheme} from '#/alf'
import {useEmojiFont} from '#/state/preferences/emoji-font/context'

/** Emoji the browser draws from the same font as the surrounding text. */
const PROBE = '🟦'

type Box = {
  /** Width of the glyph's advance, which the slot reserves. */
  width: number
  /** Height of the glyph's content box, which the slot reserves. */
  height: number
}

export function InlineImage({
  size,
  loading = false,
  baselineOffset: _baselineOffset,
  ...props
}: {
  size: number
  baselineOffset?: number
  loading?: boolean
} & Omit<ImageProps, 'style'>) {
  const t = useTheme()
  const emojiFont = useEmojiFont()
  const probe = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState<Box>()

  /*
   * Size the slot from what the browser actually paints for an emoji rather
   * than deriving it from the font size: an emoji's ink is taller and wider
   * than its nominal size, and the ratio depends on the emoji font in use, so
   * the glyph itself is the only reliable measurement. Native does the same,
   * reading the advance from `onTextLayout`.
   */
  const measure = () => {
    const element = probe.current
    if (!element) return
    const range = document.createRange()
    range.selectNodeContents(element)
    const glyph = range.getBoundingClientRect()
    if (!glyph.width || !glyph.height) return
    setBox(previous =>
      previous?.width === glyph.width &&
      previous.height === glyph.height
        ? previous
        : {width: glyph.width, height: glyph.height},
    )
  }

  useLayoutEffect(measure, [size, emojiFont])

  // A webfont can land after first paint; measure again when it does.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
    }
  }, [size, emojiFont])

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'text-bottom',
        width: box?.width ?? size,
        height: box?.height ?? size,
      }}>
      {/* Measure without adding a second line box inside the image slot. */}
      <span
        ref={probe}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
        {PROBE}
      </span>
      {/* The square glyph's advance excludes the font's vertical leading. */}
      <Image
        {...props}
        style={{
          backgroundColor: loading ? t.palette.contrast_50 : undefined,
          borderRadius: loading ? 4 : 0,
          position: 'absolute',
          bottom: box ? Math.max(0, (box.height - box.width) / 2) : 0,
          left: '50%',
          transform: [{translateX: '-50%'}],
          height: box ? Math.min(box.width, box.height) : size,
          aspectRatio: 1,
        }}
      />
    </span>
  )
}

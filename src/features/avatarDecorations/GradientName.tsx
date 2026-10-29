import {UITextView} from '#/platform/ui-text-view'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {IS_WEB} from '#/env'
import {type NameGradient} from './nameGradients'
import {useNameGradient} from './useDecorations'

/** Renders gradient colors across native text while preserving inline layout. */
export function GradientName({
  did,
  gradient: suppliedGradient,
  enabled = true,
  children,
}: {
  did?: string
  gradient?: NameGradient
  enabled?: boolean
  children: string
}) {
  const activeGradient = useNameGradient(did)
  const gradient = suppliedGradient ?? activeGradient
  if (IS_WEB) return children
  if (!enabled || !gradient) return <UITextView>{children}</UITextView>

  const segments = [...splitGraphemes(children)]
  return (
    <UITextView>
      {segments.map((segment, index) => {
        if (gradient.segmented) {
          const colorIndex = Math.floor(
            (index / segments.length) * gradient.colors.length,
          )
          return (
            <UITextView
              key={index}
              style={{color: gradient.colors[colorIndex]}}>
              {segment}
            </UITextView>
          )
        }
        const position =
          (index / Math.max(segments.length - 1, 1)) *
          (gradient.colors.length - 1)
        const start = Math.floor(position)
        const end = Math.min(start + 1, gradient.colors.length - 1)
        const fraction = position - start
        const from = parseInt(gradient.colors[start].slice(1), 16)
        const to = parseInt(gradient.colors[end].slice(1), 16)
        const channel = (shift: number) =>
          Math.round(
            ((from >> shift) & 255) * (1 - fraction) +
              ((to >> shift) & 255) * fraction,
          )
        const color = `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
        return (
          <UITextView key={index} style={{color}}>
            {segment}
          </UITextView>
        )
      })}
    </UITextView>
  )
}

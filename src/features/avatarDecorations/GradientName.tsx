import createEmojiRegex from 'emoji-regex'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {UITextView} from '#/platform/ui-text-view'
import {renderChildrenWithEmoji} from '#/alf/typography'
import {IS_ANDROID, IS_WEB} from '#/env'
import {type NameGradient} from './nameGradients'
import {nameGradientTextStyle} from './nameGradientStyle'
import {OutlinedName} from './OutlinedName'
import {useNameGradient, useNameStyle} from './useDecorations'

/** Renders gradient colors across native text while preserving inline layout. */
export function GradientName({
  did,
  gradient: suppliedGradient,
  outline,
  enabled = true,
  children,
}: {
  did?: string
  gradient?: Pick<NameGradient, 'colors' | 'segmented'>
  outline?: boolean
  enabled?: boolean
  children: string
}) {
  const activeGradient = useNameGradient(did)
  const nameStyle = useNameStyle(did)
  const gradient = suppliedGradient ?? activeGradient
  if (IS_WEB) {
    return enabled && gradient
      ? renderChildrenWithEmoji(children, {}, true, false, true)
      : children
  }
  if (!enabled || !gradient) return <UITextView>{children}</UITextView>

  const segments = [...splitGraphemes(children)]
  const outlineStyle =
    outline !== undefined
      ? nameGradientTextStyle(gradient, {outline})
      : nameStyle
  const shadow = {
    textShadowColor: IS_ANDROID ? 'transparent' : outlineStyle?.textShadowColor,
    textShadowOffset: outlineStyle?.textShadowOffset,
    textShadowRadius: IS_ANDROID ? 0 : outlineStyle?.textShadowRadius,
  }
  const characters = segments.map((segment, index) => {
    if (createEmojiRegex().test(segment)) {
      return (
        <UITextView key={index} style={[shadow, {fontFamily: 'System'}]}>
          {segment}
        </UITextView>
      )
    }
    if (gradient.segmented) {
      const colorIndex = Math.floor(
        (index / segments.length) * gradient.colors.length,
      )
      return (
        <UITextView
          key={index}
          style={[shadow, {color: gradient.colors[colorIndex]}]}>
          {segment}
        </UITextView>
      )
    }
    const position =
      (index / Math.max(segments.length - 1, 1)) * (gradient.colors.length - 1)
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
      <UITextView key={index} style={[shadow, {color}]}>
        {segment}
      </UITextView>
    )
  })
  if (!IS_ANDROID || !outlineStyle?.textShadowColor) {
    return <UITextView>{characters}</UITextView>
  }
  const runs: {
    text: string
    outlined: boolean
    characters: React.ReactNode[]
  }[] = []
  segments.forEach((segment, index) => {
    const outlined = !/\s/u.test(segment) && !createEmojiRegex().test(segment)
    const previous = runs[runs.length - 1]
    if (outlined && previous?.outlined) {
      previous.text += segment
      previous.characters.push(characters[index])
    } else {
      runs.push({text: segment, outlined, characters: [characters[index]]})
    }
  })
  return (
    <UITextView>
      {runs.map((run, index) =>
        run.outlined ? (
          <OutlinedName key={index} text={run.text}>
            {run.characters}
          </OutlinedName>
        ) : (
          <UITextView key={index}>{run.characters}</UITextView>
        ),
      )}
    </UITextView>
  )
}

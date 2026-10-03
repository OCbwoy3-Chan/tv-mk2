import {Children, isValidElement} from 'react'
import {StyleSheet, Text} from 'react-native'

import {renderChildrenWithEmoji, type TextProps} from '../typography'

jest.mock('#/alf', () => ({}))
jest.mock('#/env', () => ({IS_IOS: false, IS_NATIVE: true, IS_WEB: false}))
jest.mock('#/lib/notoEmojiFont', () => ({
  NOTO_EMOJI_FONT: 'WitchskyNotoColorEmoji',
}))
jest.mock('#/platform/ui-text-view', () => ({
  UITextView:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))

const env = jest.requireMock<typeof import('#/env')>('#/env')

afterEach(() => jest.restoreAllMocks())

describe('emoji font rendering', () => {
  it('preserves surrounding text and keeps complete emoji sequences together', () => {
    const sequences = ['😀', '👍🏽', '🏳️‍🌈', '👩‍👩‍👧‍👦', '🇺🇸', '1️⃣']
    const text = `Hello ${sequences.join(' ')} world`
    const parts = Children.toArray(
      renderChildrenWithEmoji(
        text,
        {style: {fontFamily: 'Inter-Bold', fontSize: 20, color: 'red'}},
        true,
        true,
      ),
    )
    const emoji = parts.filter(isValidElement<TextProps>)

    expect(emoji.map(element => element.props.children)).toEqual(sequences)
    expect(
      parts
        .map(part => {
          const content = isValidElement<TextProps>(part)
            ? part.props.children
            : part
          return typeof content === 'string' ? content : ''
        })
        .join(''),
    ).toBe(text)
    for (const element of emoji) {
      expect(StyleSheet.flatten(element.props.style)).toMatchObject({
        fontFamily: 'WitchskyNotoColorEmoji',
        fontSize: 20,
        color: 'red',
        fontWeight: 'normal',
        fontStyle: 'normal',
      })
    }
  })

  it('leaves ordinary text and nested elements intact', () => {
    const nested = <Text>Nested text</Text>
    const parts = Children.toArray(
      renderChildrenWithEmoji(['Hello 123', nested], {}, true, true),
    )
    expect(parts[0]).toBe('Hello 123')
    expect(parts[1]).toMatchObject({type: Text, props: nested.props})
  })

  it('restores platform rendering when disabled on Android and web', () => {
    const text = 'Hello 😀'
    expect(renderChildrenWithEmoji(text, {}, true, false)).toBe(text)
  })

  it('keeps web text on a single baseline through font fallback', () => {
    jest.replaceProperty(env, 'IS_WEB', true)
    const nested = <Text>Nested 😀</Text>
    const children = ['Hello 😀 123 1️⃣', nested]
    expect(renderChildrenWithEmoji(children, {}, true, true)).toBe(children)
  })

  it('preserves the iOS system emoji fallback when disabled', () => {
    jest.replaceProperty(env, 'IS_IOS', true)
    const parts = Children.toArray(
      renderChildrenWithEmoji('Hello 😀', {}, true, false),
    )
    const emoji = parts.filter(isValidElement<TextProps>)
    expect(emoji).toHaveLength(1)
    expect(StyleSheet.flatten(emoji[0].props.style)?.fontFamily).toBe('System')
  })
})

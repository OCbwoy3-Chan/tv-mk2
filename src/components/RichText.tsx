import {useMemo, useState} from 'react'
import {type StyleProp, Text as NativeText, type TextStyle} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {useLingui} from '@lingui/react/macro'

import {type HtmlSegment, segmentsToText} from '#/lib/strings/bridged-html'
import {type Kind, piecesOf} from '#/lib/strings/formatting'
import {isRTLText} from '#/lib/strings/text-direction'
import {toShortUrl} from '#/lib/strings/url-helpers'
import {
  android,
  atoms as a,
  flatten,
  type TextStyleProp,
  useAlf,
  useTheme,
  web,
} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {InlineLinkText, type LinkProps} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichTextTag} from '#/components/RichTextTag'
import {Text, type TextProps} from '#/components/Typography'
import {IS_ANDROID, IS_NATIVE} from '#/env'
import {InlineBluemoji} from '#/features/bluemoji/InlineBluemoji'
import {isOnlyEmojiRichText} from '#/features/bluemoji/richText'
import {getBluemojiFacet} from '#/features/bluemoji/util'
import {stripPollLines} from '#/features/pollblue/parse'
import {type PollPostParts} from '#/features/pollblue/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

const WORD_WRAP = {wordWrap: 1}
// lifted from facet detection in `RichText` impl, _without_ `gm` flags
const URL_REGEX =
  /(^|\s|\()(?!javascript:)([a-z][a-z0-9+.-]*:\/\/[\S]+|(?:[a-z0-9]+\.)+[a-z0-9]+(:[0-9]+)?[\S]*|[a-z][a-z0-9+.-]*:[^\s()]+)/i

export type RichTextProps = TextStyleProp &
  Pick<TextProps, 'selectable' | 'onLayout' | 'onTextLayout'> & {
    value: RichTextAPI | string
    testID?: string
    numberOfLines?: number
    disableLinks?: boolean
    /** Enable emoji details on the focused native post. */
    enableEmojiDetails?: boolean
    enableTags?: boolean
    authorHandle?: string
    onLinkPress?: LinkProps['onPress']
    interactiveStyle?: StyleProp<TextStyle>
    emojiMultiplier?: number
    shouldProxyLinks?: boolean
    suffix?: React.ReactNode
    /**
     * How far below the text baseline `suffix` extends, in px.
     *
     * Android clips inline views that are translated below the measured text
     * bounds. Reserve matching room there and cancel it with a negative margin
     * so content following the text does not move. iOS allows inline attachment
     * overflow through `RNUITextView` and does not need this compensation.
     *
     * Overrides any `paddingBottom`/`marginBottom` set via `style` on Android.
     */
    suffixOffset?: number
    /**
     * DANGEROUS: Disable facet lexicon validation
     *
     * `detectFacetsWithoutResolution()` generates technically invalid facets,
     * with a handle in place of the DID. This means that RichText that uses it
     * won't be able to render links.
     *
     * Use with care - only use if you're rendering facets you're generating yourself.
     */
    disableMentionFacetValidation?: true
    /**
     * Formatted text from a bridged fediverse post, rendered instead of
     * `value`. Mention facets on `value` are still used to link mentions to
     * profiles.
     */
    htmlSegments?: HtmlSegment[]
    /**
     * A poll.blue post's own option lines repeat what the poll card renders.
     * Pass `pollPostParts(record)` to drop those lines and keep the question.
     */
    pollParts?: PollPostParts | null
  }

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
  disableLinks,
  enableEmojiDetails = false,
  selectable,
  enableTags = false,
  authorHandle,
  onLinkPress,
  interactiveStyle,
  emojiMultiplier = 1.85,
  onLayout,
  onTextLayout,
  shouldProxyLinks,
  suffix,
  suffixOffset = 0,
  disableMentionFacetValidation,
  htmlSegments,
  pollParts,
}: RichTextProps) {
  const richText = useMemo(() => {
    if (!pollParts) {
      if (value instanceof RichTextAPI) {
        return value
      }
      const rt = new RichTextAPI({text: value})
      rt.detectFacetsWithoutResolution()
      return rt
    }
    /*
     * A poll post repeats its options as single-line facets. Keep the question
     * only; the facets share the same byte offsets, so they stay aligned.
     */
    const base =
      value instanceof RichTextAPI ? value : new RichTextAPI({text: value})
    const text = stripPollLines(base.text, pollParts)
    /*
     * The option lines carried their own facets. Keep only the ones still
     * inside the trimmed text so nothing points past the end of the string.
     */
    const maxBytes = new TextEncoder().encode(text).length
    const facets = base.facets?.filter(facet => facet.index.byteEnd <= maxBytes)
    return new RichTextAPI({text, facets})
  }, [value, pollParts])

  const t = useTheme()
  const {fonts} = useAlf()
  const nativeFontScale = useNativeFontScale()
  const [nativeEmojiMeasurement, setNativeEmojiMeasurement] = useState<{
    fontSize: number
    width: number
    descender: number
  }>()
  const {facets} = richText
  const text = htmlSegments ? segmentsToText(htmlSegments) : richText.text
  const emojiOnly = !htmlSegments && isOnlyEmojiRichText(richText)
  const fontSize =
    (flatten(style).fontSize ?? a.text_sm.fontSize) *
    (emojiOnly ? emojiMultiplier : 1)
  const plainStyles: StyleProp<TextStyle> = [
    style,
    emojiOnly ? {fontSize} : null,
    IS_NATIVE && isRTLText(text) ? {textAlign: 'right'} : null,
  ]
  const suffixStyles =
    suffix && suffixOffset
      ? android({paddingBottom: suffixOffset, marginBottom: -suffixOffset})
      : null
  const interactiveStyles = [plainStyles, interactiveStyle]
  const scaledFontSize = fontSize * fonts.scaleMultiplier
  const nativeEmojiFontSize = scaledFontSize * nativeFontScale
  const customEmojiSize = IS_NATIVE
    ? nativeEmojiMeasurement?.fontSize === nativeEmojiFontSize
      ? nativeEmojiMeasurement.width
      : nativeEmojiFontSize
    : scaledFontSize

  if (!facets?.length && !htmlSegments) {
    return (
      <Text
        emoji
        selectable={selectable}
        testID={testID}
        style={[plainStyles, suffixStyles]}
        numberOfLines={emojiOnly ? undefined : numberOfLines}
        onLayout={onLayout}
        onTextLayout={onTextLayout}
        dataSet={WORD_WRAP}>
        {text}
        {suffix ? ' ' : null}
        {suffix}
      </Text>
    )
  }

  const els = []
  let key = 0
  if (htmlSegments) {
    const mentionDids = new Map<string, string>()
    for (const segment of richText.segments()) {
      if (
        segment.mention &&
        bsky.matches(app.bsky.richtext.facet.mention, segment.mention)
      ) {
        mentionDids.set(segment.text, segment.mention.did)
      }
    }
    for (const segment of htmlSegments) {
      const did =
        segment.mention && (segment.did ?? mentionDids.get(segment.text))
      if (!disableLinks && did) {
        els.push(
          <ProfileHoverCard key={key} did={did}>
            <InlineLinkText
              selectable={selectable}
              to={`/profile/${did}`}
              style={interactiveStyles}
              // @ts-expect-error TODO
              dataSet={WORD_WRAP}
              shouldProxy={shouldProxyLinks}
              onPress={onLinkPress}>
              {segment.text}
            </InlineLinkText>
          </ProfileHoverCard>,
        )
      } else if (!disableLinks && segment.link) {
        els.push(
          <InlineLinkText
            selectable={selectable}
            key={key}
            to={segment.link}
            style={interactiveStyles}
            // @ts-expect-error TODO
            dataSet={WORD_WRAP}
            shareOnLongPress
            shouldProxy={shouldProxyLinks}
            onPress={onLinkPress}
            emoji>
            {segment.text}
          </InlineLinkText>,
        )
      } else if (!disableLinks && enableTags && segment.tag) {
        els.push(
          <RichTextTag
            key={key}
            display={segment.text}
            tag={segment.tag}
            textStyle={interactiveStyles}
            authorHandle={authorHandle}
          />,
        )
      } else if (
        segment.bold ||
        segment.italic ||
        segment.underline ||
        segment.strike ||
        segment.code ||
        segment.quote
      ) {
        els.push(
          <Text
            key={key}
            emoji
            selectable={selectable}
            style={[
              plainStyles,
              segment.bold && a.font_bold,
              segment.italic && a.italic,
              segment.underline && a.underline,
              segment.strike && a.strike_through,
              segment.quote && t.atoms.text_contrast_medium,
              segment.code && {
                fontFamily: IS_ANDROID ? 'monospace' : 'Courier New',
              },
            ]}>
            {segment.text}
          </Text>,
        )
      } else {
        els.push(segment.text)
      }
      key++
    }
  } else {
    const pieces = piecesOf(richText.text, facets)
    const formatStyles = (kinds: Kind[]): StyleProp<TextStyle> => [
      kinds.includes('bold') && a.font_bold,
      kinds.includes('italic') && a.italic,
      kinds.includes('strikethrough') && a.strike_through,
      kinds.includes('code') && {
        fontFamily: IS_ANDROID ? 'monospace' : 'Courier New',
        backgroundColor: t.palette.contrast_25,
      },
    ]
    for (let i = 0; i < pieces.length; i++) {
      const segment = pieces[i]
      if (segment.spoiler !== undefined) {
        const group = [segment]
        while (pieces[i + 1]?.spoiler === segment.spoiler) {
          group.push(pieces[++i])
        }
        els.push(
          <Spoiler
            key={`${richText.text}:${segment.start}`}
            style={plainStyles}
            selectable={selectable}>
            {group.map(piece => (
              <Text
                key={piece.start}
                emoji
                style={[plainStyles, formatStyles(piece.kinds)]}>
                {piece.text}
              </Text>
            ))}
          </Spoiler>,
        )
        continue
      }
      // Code and spoilers are always literal, even if another client adds
      // interactive facets over them.
      const features = segment.kinds.includes('code') ? [] : segment.features
      const mention = features.find(feature =>
        bsky.isType(app.bsky.richtext.facet.mention, feature),
      )
      const link = features.find(feature =>
        bsky.isType(app.bsky.richtext.facet.link, feature),
      )
      const tag = features.find(feature =>
        bsky.isType(app.bsky.richtext.facet.tag, feature),
      )
      const bluemojiFeature = features.find(feature =>
        getBluemojiFacet(feature),
      )
      const bluemoji = getBluemojiFacet(bluemojiFeature)
      const formatting = formatStyles(segment.kinds)
      const pieceStyles = [interactiveStyles, formatting]
      if (
        mention &&
        (disableMentionFacetValidation ||
          bsky.matches(app.bsky.richtext.facet.mention, mention)) &&
        !disableLinks
      ) {
        els.push(
          <ProfileHoverCard key={key} did={mention.did}>
            <InlineLinkText
              selectable={selectable}
              to={`/profile/${mention.did}`}
              style={pieceStyles}
              // @ts-expect-error TODO
              dataSet={WORD_WRAP}
              shouldProxy={shouldProxyLinks}
              onPress={onLinkPress}>
              {segment.text}
            </InlineLinkText>
          </ProfileHoverCard>,
        )
      } else if (link && bsky.matches(app.bsky.richtext.facet.link, link)) {
        const isValidLink = URL_REGEX.test(link.uri)
        // Shortening a fragment would discard text at a formatting boundary.
        const split =
          pieces[i - 1]?.features.includes(link) ||
          pieces[i + 1]?.features.includes(link)
        const label = split ? segment.text : toShortUrl(segment.text)
        if (!isValidLink || disableLinks) {
          els.push(
            segment.kinds.length ? (
              <Text
                key={key}
                emoji
                selectable={selectable}
                style={[plainStyles, formatting]}>
                {label}
              </Text>
            ) : (
              label
            ),
          )
        } else {
          els.push(
            <InlineLinkText
              selectable={selectable}
              key={key}
              to={link.uri}
              style={pieceStyles}
              // @ts-expect-error TODO
              dataSet={WORD_WRAP}
              shareOnLongPress
              shouldProxy={shouldProxyLinks}
              onPress={onLinkPress}
              emoji>
              {label}
            </InlineLinkText>,
          )
        }
      } else if (
        !disableLinks &&
        enableTags &&
        tag &&
        bsky.matches(app.bsky.richtext.facet.tag, tag)
      ) {
        els.push(
          <RichTextTag
            key={key}
            display={segment.text}
            tag={tag.tag}
            textStyle={pieceStyles}
            authorHandle={authorHandle}
          />,
        )
      } else if (
        bluemoji &&
        bluemojiFeature &&
        !pieces.some(
          piece =>
            (piece.spoiler !== undefined || piece.kinds.includes('code')) &&
            piece.features.includes(bluemojiFeature),
        )
      ) {
        // An emoji is one attachment, even when formatting splits its alias.
        let fallbackText = segment.text
        while (pieces[i + 1]?.features.includes(bluemojiFeature)) {
          fallbackText += pieces[++i].text
        }
        els.push(
          <InlineBluemoji
            key={key}
            interactive={enableEmojiDetails}
            claim={bluemoji}
            fallbackText={fallbackText}
            size={customEmojiSize}
            baselineOffset={
              IS_NATIVE &&
              nativeEmojiMeasurement?.fontSize === nativeEmojiFontSize
                ? nativeEmojiMeasurement.descender
                : undefined
            }
          />,
        )
      } else {
        els.push(
          segment.kinds.length ? (
            <Text
              key={key}
              emoji
              selectable={selectable}
              style={[plainStyles, formatting]}>
              {segment.text}
            </Text>
          ) : (
            segment.text
          ),
        )
      }
      key++
    }
  }

  const content = (
    <Text
      emoji
      selectable={selectable}
      testID={testID}
      style={[plainStyles, suffixStyles]}
      numberOfLines={emojiOnly ? undefined : numberOfLines}
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      dataSet={WORD_WRAP}>
      {els}
      {suffix ? ' ' : null}
      {suffix}
    </Text>
  )
  if (
    !IS_NATIVE ||
    !facets?.some(facet => facet.features.some(getBluemojiFacet))
  )
    return content

  /*
   * Native emoji fonts can draw a glyph wider than its nominal font size.
   * Measuring its advance also includes the system's accessibility font scale.
   * Opacity hides color emoji, which ignore a transparent text color.
   */
  return (
    <>
      {content}
      <NativeText
        testID="nativeEmojiMeasurement"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        allowFontScaling
        numberOfLines={1}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          opacity: 0,
          width: 10000,
          fontSize: scaledFontSize,
          includeFontPadding: false,
        }}
        onTextLayout={event => {
          const line = event.nativeEvent.lines[0]
          const width = line?.width
          const descender = line?.descender
          if (!width || !Number.isFinite(width)) return
          if (!Number.isFinite(descender) || descender < 0) return
          setNativeEmojiMeasurement(previous =>
            previous?.fontSize === nativeEmojiFontSize &&
            previous.width === width &&
            previous.descender === descender
              ? previous
              : {fontSize: nativeEmojiFontSize, width, descender},
          )
        }}>
        😀
      </NativeText>
    </>
  )
}

function Spoiler({
  children,
  style,
  selectable,
}: Pick<TextProps, 'children' | 'style' | 'selectable'>) {
  const {t} = useLingui()
  const theme = useTheme()
  const [revealed, setRevealed] = useState(false)
  return (
    <Text
      emoji
      accessible
      accessibilityRole="button"
      accessibilityLabel={revealed ? undefined : t`Reveal spoiler`}
      accessibilityHint={revealed ? t`Hide spoiler` : t`Shows hidden text`}
      accessibilityState={{expanded: revealed}}
      selectable={revealed && selectable}
      style={[
        style,
        {
          backgroundColor: theme.palette.contrast_100,
          borderRadius: 3,
        },
        !revealed && theme.atoms.text_contrast_medium,
      ]}
      {...web({
        tabIndex: 0,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          event.stopPropagation()
          if (!event.repeat) setRevealed(value => !value)
        },
      })}
      onPress={event => {
        event.preventDefault()
        event.stopPropagation()
        setRevealed(value => !value)
      }}>
      {revealed ? children : t`Spoiler`}
    </Text>
  )
}

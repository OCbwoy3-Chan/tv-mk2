import {type StyleProp, StyleSheet, type TextStyle} from 'react-native'
import {type Unknown$TypedObject} from '@atproto/lex'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

type LinkProps = {
  to: string
  children?: React.ReactNode
  style?: StyleProp<TextStyle>
}

let mockLinkTargets: string[] = []
let mockTagTargets: string[] = []
let mockEmojiCalls: {
  fallbackText: string
  size: number
  interactive: boolean
}[] = []

jest.mock('#/alf', () => ({
  atoms: {
    text_sm: {fontSize: 14},
    flex_row: {},
    font_bold: {fontWeight: '700'},
    italic: {fontStyle: 'italic'},
    strike_through: {textDecorationLine: 'line-through'},
  },
  useTheme: () => ({
    atoms: {text_contrast_medium: {color: '#555'}},
    palette: {
      contrast_25: '#eee',
      contrast_100: '#ddd',
      contrast_500: '#777',
      contrast_600: '#666',
      contrast_900: '#111',
      primary_600: '#36c',
      primary_700: '#25b',
      primary_800: '#149',
      positive_700: '#080',
      negative_700: '#b22',
    },
  }),
  useAlf: () => ({fonts: {scaleMultiplier: 1}}),
  flatten: (style: unknown) =>
    Object.assign(
      {},
      ...(
        (Array.isArray(style) ? style.flat(Infinity) : [style]) as object[]
      ).filter(Boolean),
    ),
  android: () => ({}),
  web: (props: object) => props,
}))
jest.mock('#/alf/util/dimensions', () => ({
  useNativeFontScale: () => 1,
}))
jest.mock('#/env', () => ({IS_NATIVE: false, IS_ANDROID: false}))
jest.mock('#/components/Link', () => ({
  InlineLinkText: (props: LinkProps) => {
    const {Text} = require('react-native')
    mockLinkTargets.push(props.to)
    return (
      <Text accessibilityRole="link" style={props.style}>
        {props.children}
      </Text>
    )
  },
}))
jest.mock('#/components/ProfileHoverCard', () => ({
  ProfileHoverCard: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/components/RichTextTag', () => ({
  RichTextTag: ({
    display,
    tag,
    textStyle,
  }: {
    display: string
    tag: string
    textStyle: StyleProp<TextStyle>
  }) => {
    const {Text} = require('react-native')
    mockTagTargets.push(tag)
    return (
      <Text accessibilityRole="link" style={textStyle}>
        {display}
      </Text>
    )
  },
}))
jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native')
  return {Text, default: Text}
})
jest.mock('#/features/bluemoji/InlineBluemoji', () => ({
  InlineBluemoji: (props: {
    fallbackText: string
    size: number
    interactive: boolean
  }) => {
    const {Text} = require('react-native')
    mockEmojiCalls.push(props)
    return <Text testID="inlineEmoji">{props.fallbackText}</Text>
  },
}))
jest.mock('#/features/bluemoji/richText', () => ({
  isOnlyEmojiRichText: () => false,
}))
jest.mock('#/features/bluemoji/util', () => ({
  getBluemojiFacet: (feature?: {$type?: string}) =>
    feature?.$type === 'blue.moji.richtext.facet' ? feature : undefined,
}))
jest.mock('#/features/pollblue/parse', () => ({
  stripPollLines: (t: string) => t,
}))

import {featureOf, type Kind, shift} from '#/lib/strings/formatting'
import {applyFacetSyntax} from '#/lib/strings/rich-text-manip'
import {FormattingPreview} from '#/view/com/composer/text-input/FormattingPreview'
import {RichText} from '#/components/RichText'

const i18n = setupI18n({locale: 'en', messages: {en: {}}})
type Facet = NonNullable<RichTextAPI['facets']>[number]

function withFacets(
  text: string,
  spans: {start: number; end: number; features: Facet['features']}[],
) {
  const encoder = new TextEncoder()
  return new RichTextAPI({
    text,
    facets: spans.map(({start, end, features}) => ({
      index: {
        byteStart: encoder.encode(text.slice(0, start)).length,
        byteEnd: encoder.encode(text.slice(0, end)).length,
      },
      features,
    })),
  })
}

function richTextWithLink(uri: string) {
  const text = 'click here'
  const rt = new RichTextAPI({text})
  rt.facets = [
    {
      index: {byteStart: 0, byteEnd: new TextEncoder().encode(text).length},
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: uri as `${string}:${string}`,
        },
      ],
    },
  ]
  return rt
}

beforeEach(() => {
  mockLinkTargets = []
  mockTagTargets = []
  mockEmojiCalls = []
})

it('renders a link facet with a genuine host as a link', () => {
  render(<RichText value={richTextWithLink('https://example.com/a')} />)
  expect(mockLinkTargets).toEqual(['https://example.com/a'])
})

it.each(['https://...', 'https://', 'https://example.com.', 'at://did:x/y'])(
  'renders a facet with a degenerate host as plain text: %s',
  uri => {
    render(<RichText value={richTextWithLink(uri)} />)
    expect(mockLinkTargets).toEqual([])
  },
)

it.each<{kind: Kind; marker: string; style: TextStyle}>([
  {kind: 'bold', marker: '**', style: {fontWeight: '700'}},
  {kind: 'italic', marker: '_', style: {fontStyle: 'italic'}},
  {
    kind: 'strikethrough',
    marker: '~~',
    style: {textDecorationLine: 'line-through'},
  },
  {kind: 'code', marker: '`', style: {fontFamily: 'Courier New'}},
])(
  'renders $kind and removes only its paired markers',
  ({kind, marker, style}) => {
    const text = `${marker}hello${marker}`
    const screen = render(
      <RichText
        value={withFacets(text, [
          {
            start: marker.length,
            end: marker.length + 5,
            features: [featureOf(kind)],
          },
        ])}
      />,
    )
    expect(
      StyleSheet.flatten(screen.getByText('hello').props.style),
    ).toMatchObject(style)
    expect(screen.queryByText(text)).toBeNull()
  },
)

it('renders formatting without markers and preserves unfaceted markdown', () => {
  const screen = render(
    <RichText
      value={withFacets('hello **literal**', [
        {start: 0, end: 5, features: [featureOf('bold')]},
      ])}
    />,
  )
  expect(
    StyleSheet.flatten(screen.getByText('hello').props.style),
  ).toMatchObject({fontWeight: '700'})
  expect(screen.getByText('hello **literal**')).toBeTruthy()
})

it('renders crossing spans without losing text or either overlapping style', () => {
  const screen = render(
    <RichText
      value={withFacets('abcdef', [
        {start: 0, end: 4, features: [featureOf('bold')]},
        {start: 2, end: 6, features: [featureOf('italic')]},
      ])}
    />,
  )
  expect(StyleSheet.flatten(screen.getByText('ab').props.style)).toMatchObject({
    fontWeight: '700',
  })
  expect(StyleSheet.flatten(screen.getByText('cd').props.style)).toMatchObject({
    fontWeight: '700',
    fontStyle: 'italic',
  })
  expect(StyleSheet.flatten(screen.getByText('ef').props.style)).toMatchObject({
    fontStyle: 'italic',
  })
})

it('keeps a split URL label intact and combines link and formatting styles', () => {
  const text = 'https://example.com/path'
  const screen = render(
    <RichText
      value={withFacets(text, [
        {
          start: 0,
          end: text.length,
          features: [{$type: 'app.bsky.richtext.facet#link', uri: text}],
        },
        {start: 8, end: 15, features: [featureOf('bold')]},
      ])}
    />,
  )
  expect(screen.getByText('https://')).toBeTruthy()
  expect(screen.getByText('.com/path')).toBeTruthy()
  expect(
    StyleSheet.flatten(screen.getByText('example').props.style),
  ).toMatchObject({fontWeight: '700'})
  expect(mockLinkTargets).toEqual([text, text, text])
})

it('composes formatting with mentions, tags and a single split bluemoji', () => {
  const text = '@alice #tag :wave:'
  const screen = render(
    <RichText
      enableTags
      style={{fontSize: 20}}
      value={withFacets(text, [
        {start: 0, end: text.length, features: [featureOf('italic')]},
        {
          start: 0,
          end: 6,
          features: [
            {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice'},
          ],
        },
        {
          start: 7,
          end: 11,
          features: [{$type: 'app.bsky.richtext.facet#tag', tag: 'tag'}],
        },
        {
          start: 12,
          end: text.length,
          features: [
            {
              $type: 'blue.moji.richtext.facet',
              name: 'wave',
            } as unknown as Unknown$TypedObject,
          ],
        },
        {start: 13, end: 17, features: [featureOf('bold')]},
      ])}
    />,
  )
  expect(mockLinkTargets).toEqual(['/profile/did:plc:alice'])
  expect(mockTagTargets).toEqual(['tag'])
  for (const label of ['@alice', '#tag']) {
    expect(
      StyleSheet.flatten(screen.getByText(label).props.style),
    ).toMatchObject({
      fontStyle: 'italic',
    })
  }
  expect(screen.getAllByTestId('inlineEmoji')).toHaveLength(1)
  expect(mockEmojiCalls).toEqual([
    expect.objectContaining({fallbackText: ':wave:', size: 20}),
  ])
})

it('never mounts hidden spoiler text, links, mentions, tags or emoji', () => {
  const secret = 'secret @alice #tag :wave:'
  const text = `||${shift(secret)}||`
  const screen = render(
    <I18nProvider i18n={i18n}>
      <RichText
        enableTags
        suffix="suffix"
        value={withFacets(text, [
          {start: 2, end: text.length - 2, features: [featureOf('spoiler')]},
          {start: 2, end: 8, features: [featureOf('bold')]},
          {
            start: 2,
            end: 8,
            features: [
              {
                $type: 'app.bsky.richtext.facet#link',
                uri: 'https://secret.test',
              },
            ],
          },
          {
            start: 9,
            end: 15,
            features: [
              {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice'},
            ],
          },
          {
            start: 16,
            end: 20,
            features: [{$type: 'app.bsky.richtext.facet#tag', tag: 'tag'}],
          },
          {
            start: 21,
            end: text.length - 2,
            features: [
              {
                $type: 'blue.moji.richtext.facet',
                name: 'wave',
              } as unknown as Unknown$TypedObject,
            ],
          },
        ])}
      />
    </I18nProvider>,
  )
  const button = screen.getByRole('button', {name: 'Reveal spoiler'})
  expect(button.props.accessibilityState).toEqual({expanded: false})
  expect(JSON.stringify(screen.toJSON())).not.toContain('secret')
  expect(mockLinkTargets).toEqual([])
  expect(mockTagTargets).toEqual([])
  expect(mockEmojiCalls).toEqual([])
  expect(screen.queryByText('secret')).toBeNull()

  const event = {preventDefault: jest.fn(), stopPropagation: jest.fn()}
  fireEvent.press(button, event)
  expect(event.preventDefault).toHaveBeenCalledTimes(1)
  expect(event.stopPropagation).toHaveBeenCalledTimes(1)
  expect(screen.getByText('secret')).toBeTruthy()
  expect(screen.getByText('@alice')).toBeTruthy()
  expect(screen.getByText('#tag')).toBeTruthy()
  expect(screen.getByText(':wave:')).toBeTruthy()
  expect(
    StyleSheet.flatten(screen.getByText('secret').props.style),
  ).toMatchObject({fontWeight: '700'})
  expect(mockLinkTargets).toEqual([])
  expect(mockTagTargets).toEqual([])
  expect(mockEmojiCalls).toEqual([])

  fireEvent.press(screen.getByRole('button'), event)
  expect(screen.queryByText('secret')).toBeNull()
})

it('supports keyboard reveal and keeps independent spoiler groups separate', () => {
  const text = `${shift('first')} and ${shift('second')}`
  const screen = render(
    <I18nProvider i18n={i18n}>
      <RichText
        value={withFacets(text, [
          {start: 0, end: 5, features: [featureOf('spoiler')]},
          {start: 10, end: 16, features: [featureOf('spoiler')]},
        ])}
      />
    </I18nProvider>,
  )
  const [first] = screen.getAllByRole('button', {name: 'Reveal spoiler'})
  const event = {
    key: 'Enter',
    repeat: false,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }
  fireEvent(first, 'keyDown', event)
  expect(screen.getByText('first')).toBeTruthy()
  expect(screen.queryByText('second')).toBeNull()
  expect(event.preventDefault).toHaveBeenCalledTimes(1)
  expect(event.stopPropagation).toHaveBeenCalledTimes(1)
  fireEvent(screen.getByRole('button', {expanded: true}), 'keyDown', {
    ...event,
    key: ' ',
  })
  expect(screen.queryByText('first')).toBeNull()
})

it('treats unknown facets as literal text and leaves their markers untouched', () => {
  const screen = render(
    <RichText
      value={withFacets('**unknown**', [
        {
          start: 2,
          end: 9,
          features: [
            {
              $type: 'example.test.facet#unknown',
            } as unknown as Unknown$TypedObject,
          ],
        },
      ])}
    />,
  )
  expect(screen.getByText('**unknown**')).toBeTruthy()
  expect(mockLinkTargets).toEqual([])
})

it('previews raw composer spoilers without shifting twice or changing the source', () => {
  const source = 'Before ||**Secret 123**|| after'
  const richtext = new RichTextAPI({text: source})
  richtext.detectFacetsWithoutResolution()
  applyFacetSyntax(richtext)
  const screen = render(
    <I18nProvider i18n={i18n}>
      <FormattingPreview richtext={richtext} />
    </I18nProvider>,
  )
  expect(screen.getByTestId('composerFormattingPreview')).toBeTruthy()
  expect(screen.queryByText('Secret 123')).toBeNull()
  expect(richtext.text).toBe(source)
  fireEvent.press(screen.getByRole('button', {name: 'Reveal spoiler'}), {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  })
  expect(screen.getByText('Secret 123')).toBeTruthy()
  expect(
    StyleSheet.flatten(screen.getByText('Secret 123').props.style),
  ).toMatchObject({fontWeight: '700'})
  expect(screen.queryByText(shift('Secret 123'))).toBeNull()
  expect(richtext.text).toBe(source)
})

it('keeps multibyte characters aligned when formatting facets overlap', () => {
  const text = '🌈café'
  const screen = render(
    <RichText
      value={withFacets(text, [
        {start: 0, end: text.length, features: [featureOf('bold')]},
        {start: 2, end: text.length, features: [featureOf('italic')]},
      ])}
    />,
  )
  expect(StyleSheet.flatten(screen.getByText('🌈').props.style)).toMatchObject({
    fontWeight: '700',
  })
  expect(
    StyleSheet.flatten(screen.getByText('café').props.style),
  ).toMatchObject({
    fontWeight: '700',
    fontStyle: 'italic',
  })
})

it('keeps invalid and disabled links noninteractive without losing formatting', () => {
  const invalid = render(
    <RichText
      value={withFacets('invalid', [
        {
          start: 0,
          end: 7,
          features: [
            featureOf('bold'),
            {$type: 'app.bsky.richtext.facet#link', uri: 'https://...'},
          ],
        },
      ])}
    />,
  )
  expect(
    StyleSheet.flatten(invalid.getByText('invalid').props.style),
  ).toMatchObject({fontWeight: '700'})
  invalid.unmount()
  const disabled = render(
    <RichText
      disableLinks
      value={withFacets('https://example.com', [
        {
          start: 0,
          end: 19,
          features: [
            featureOf('italic'),
            {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
          ],
        },
      ])}
    />,
  )
  expect(
    StyleSheet.flatten(disabled.getByText('example.com').props.style),
  ).toMatchObject({fontStyle: 'italic'})
  expect(mockLinkTargets).toEqual([])
})

it('shows code literally even when a link facet covers the same text', () => {
  const text = 'https://example.com'
  const screen = render(
    <RichText
      value={withFacets(text, [
        {
          start: 0,
          end: text.length,
          features: [
            featureOf('code'),
            {$type: 'app.bsky.richtext.facet#link', uri: text},
          ],
        },
      ])}
    />,
  )
  expect(StyleSheet.flatten(screen.getByText(text).props.style)).toMatchObject({
    fontFamily: 'Courier New',
  })
  expect(mockLinkTargets).toEqual([])
})

it('renders a multiline code facet as a block without activating links', () => {
  const code = 'const café = 1\nhttps://example.com'
  const text = `before\n${code}\nafter`
  const start = text.indexOf(code)
  const screen = render(
    <RichText
      value={withFacets(text, [
        {
          start,
          end: start + code.length,
          features: [
            featureOf('code'),
            {$type: 'app.bsky.richtext.facet#link', uri: 'https://example.com'},
          ],
        },
      ])}
    />,
  )
  expect(screen.getByTestId('codeBlock')).toBeTruthy()
  expect(screen.getByText(code)).toBeTruthy()
  expect(mockLinkTargets).toEqual([])
})

it.each([
  new RichTextAPI({text: '```txt\n  literal <b> & text\n\tindented  \n```'}),
  '```txt\n  literal <b> & text\n\tindented  \n```',
])('renders unfaceted fenced code with exact whitespace in a block', value => {
  const screen = render(
    <RichText testID="body" value={value} selectable suffix="suffix" />,
  )
  const code = screen.getByText('  literal <b> & text\n\tindented  ', {
    normalizer: text => text,
  })
  expect(StyleSheet.flatten(code.props.style)).toMatchObject({
    fontFamily: 'Courier New',
    backgroundColor: '#eee',
  })
  expect(screen.getByTestId('codeBlock')).toBeTruthy()
  expect(code.props.selectable).toBe(true)
  expect(JSON.stringify(screen.toJSON())).not.toContain('```')
  expect(JSON.stringify(screen.toJSON())).toContain('suffix')
  expect(mockLinkTargets).toEqual([])
})

it('colors language tokens and leaves inline backticks unchanged', () => {
  const screen = render(
    <RichText
      value={'`inline`\n```typescript\nconst answer = "yes"; // note\n```'}
    />,
  )
  expect(
    StyleSheet.flatten(screen.getByText('const').props.style),
  ).toMatchObject({
    color: '#b22',
  })
  expect(
    StyleSheet.flatten(screen.getByText('"yes"').props.style),
  ).toMatchObject({
    color: '#080',
  })
  expect(
    StyleSheet.flatten(screen.getByText('// note').props.style),
  ).toMatchObject({color: '#777'})
  expect(JSON.stringify(screen.toJSON())).toContain('`inline`')
  expect(JSON.stringify(screen.toJSON())).not.toContain('typescript')
})

it('preserves UTF-8 facets, layout props and suffix around multiple blocks', () => {
  const text =
    '🌈 before\n```js\nconst café = 1\n```\n中 after\n```python\nprint("été")\n```\nfin'
  const beforeEnd = text.indexOf('\n')
  const afterStart = text.indexOf('中 after')
  const finStart = text.lastIndexOf('fin')
  const onLayout = jest.fn()
  const onTextLayout = jest.fn()
  const screen = render(
    <RichText
      testID="body"
      value={withFacets(text, [
        {start: 0, end: beforeEnd, features: [featureOf('bold')]},
        {
          start: afterStart,
          end: afterStart + '中 after'.length,
          features: [featureOf('italic')],
        },
        {
          start: finStart,
          end: text.length,
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: 'https://outside.test',
            },
          ],
        },
      ])}
      style={{fontSize: 19, lineHeight: 25}}
      numberOfLines={8}
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      suffix="suffix"
    />,
  )
  expect(
    StyleSheet.flatten(screen.getByText('🌈 before').props.style),
  ).toMatchObject({fontWeight: '700', fontSize: 19, lineHeight: 25})
  expect(
    StyleSheet.flatten(screen.getByText('中 after').props.style),
  ).toMatchObject({fontStyle: 'italic'})
  expect(screen.getByText('const café = 1')).toBeTruthy()
  expect(screen.getByText('print("été")')).toBeTruthy()
  expect(mockLinkTargets).toEqual(['https://outside.test'])
  expect(screen.getByTestId('body').props.onLayout).toBe(onLayout)
  expect(StyleSheet.flatten(screen.getByTestId('body').props.style)).toMatchObject({
    maxHeight: 200,
    overflow: 'hidden',
  })
  expect(screen.getAllByTestId('codeBlock')).toHaveLength(2)
  expect(JSON.stringify(screen.toJSON())).toContain('suffix')
  expect(JSON.stringify(screen.toJSON())).not.toContain('```')
})

it.each([false, true])(
  'keeps HTML and every interactive facet literal inside code (disableLinks=%s)',
  disableLinks => {
    const code = '<b>https://code.test @alice #tag :wave:</b>'
    const text = `\`\`\`html\n${code}\n\`\`\``
    const start = text.indexOf(code)
    const screen = render(
      <RichText
        disableLinks={disableLinks}
        enableTags
        value={withFacets(text, [
          {
            start,
            end: start + code.length,
            features: [
              {$type: 'app.bsky.richtext.facet#link', uri: 'https://code.test'},
              {$type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice'},
              {$type: 'app.bsky.richtext.facet#tag', tag: 'tag'},
              {
                $type: 'blue.moji.richtext.facet',
                name: 'wave',
              } as unknown as Unknown$TypedObject,
            ],
          },
        ])}
      />,
    )
    expect(screen.getByText(code)).toBeTruthy()
    expect(mockLinkTargets).toEqual([])
    expect(mockTagTargets).toEqual([])
    expect(mockEmojiCalls).toEqual([])
    expect(screen.queryByRole('link')).toBeNull()
    expect(JSON.stringify(screen.toJSON())).not.toContain('```')
  },
)

it('never highlights or mounts a fenced block intersecting a hidden spoiler', () => {
  const secret = 'const secret = "private"'
  const text = `\`\`\`js\n${shift(secret)}\n\`\`\``
  const start = text.indexOf(shift(secret))
  const screen = render(
    <I18nProvider i18n={i18n}>
      <RichText
        value={withFacets(text, [
          {
            start,
            end: start + secret.length,
            features: [featureOf('spoiler')],
          },
        ])}
      />
    </I18nProvider>,
  )
  expect(JSON.stringify(screen.toJSON())).not.toContain('secret')
  expect(JSON.stringify(screen.toJSON())).not.toContain(shift(secret))
  // A conflicting block stays literal instead of bypassing the spoiler.
  expect(JSON.stringify(screen.toJSON())).toContain('```js')
  fireEvent.press(screen.getByRole('button', {name: 'Reveal spoiler'}), {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  })
  expect(screen.getByText(secret)).toBeTruthy()
  expect(screen.queryByText('const')).toBeNull()
})

it('renders code-only composer previews without mutating their source', () => {
  const source = '```js\nconst answer = 42\n```'
  const richtext = new RichTextAPI({text: source})
  const screen = render(
    <I18nProvider i18n={i18n}>
      <FormattingPreview richtext={richtext} />
    </I18nProvider>,
  )
  expect(screen.getByTestId('composerFormattingPreview')).toBeTruthy()
  expect(screen.getByText('const answer = 42')).toBeTruthy()
  expect(
    StyleSheet.flatten(screen.getByText('const').props.style),
  ).toMatchObject({
    color: '#b22',
  })
  expect(JSON.stringify(screen.toJSON())).not.toContain('```')
  expect(richtext.text).toBe(source)
  expect(richtext.facets).toBeUndefined()
})

it('highlights an unlabeled block with shared generic rules', () => {
  const screen = render(<RichText value={'```\nlet answer = 1\n```'} />)
  expect(StyleSheet.flatten(screen.getByText('let').props.style)).toMatchObject(
    {
      color: '#b22',
    },
  )
  expect(screen.getByText('let answer = 1')).toBeTruthy()
  expect(JSON.stringify(screen.toJSON())).not.toContain('```')
})

it('keeps a whole fenced spoiler hidden while highlighting a separate block', () => {
  const hidden = '```js\nconst privateValue = "secret"\n```'
  const text = `${shift(hidden)}\n\`\`\`js\nconst publicValue = 1\n\`\`\``
  const screen = render(
    <I18nProvider i18n={i18n}>
      <RichText
        value={withFacets(text, [
          {start: 0, end: hidden.length, features: [featureOf('spoiler')]},
        ])}
      />
    </I18nProvider>,
  )
  expect(JSON.stringify(screen.toJSON())).not.toContain('secret')
  expect(JSON.stringify(screen.toJSON())).not.toContain(shift('secret'))
  expect(screen.getByText('const publicValue = 1')).toBeTruthy()
  expect(
    StyleSheet.flatten(screen.getByText('const').props.style),
  ).toMatchObject({
    color: '#b22',
  })
  fireEvent.press(screen.getByRole('button', {name: 'Reveal spoiler'}), {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  })
  expect(screen.getByText(hidden)).toBeTruthy()
})

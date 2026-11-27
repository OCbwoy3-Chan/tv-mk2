import {Text} from 'react-native'

import {highlight, syntaxColors} from '#/lib/strings/highlight'
import {type TextStyleProp, useTheme, web} from '#/alf'
import {IS_ANDROID} from '#/env'

/** Text-only so code also works inside quote and other nested text layouts. */
export function HighlightedCode({
  code,
  language,
  style,
  selectable,
}: TextStyleProp & {
  code: string
  language: string
  selectable?: boolean
}) {
  const t = useTheme()
  const tokens = highlight(code, language)
  const colors = syntaxColors(t.palette)
  return (
    <Text
      selectable={selectable}
      style={[
        style,
        {
          fontFamily: IS_ANDROID ? 'monospace' : 'Courier New',
          backgroundColor: t.palette.contrast_25,
        },
        web({whiteSpace: 'pre-wrap'}),
      ]}>
      {tokens.map((token, index) =>
        token.kind ? (
          <Text key={index} style={{color: colors[token.kind]}}>
            {token.text}
          </Text>
        ) : (
          token.text
        ),
      )}
    </Text>
  )
}

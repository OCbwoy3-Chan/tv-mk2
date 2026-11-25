import {useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, tokens, useTheme, web} from '#/alf'
import {MusicNote_Stroke2_Corner0_Rounded as MusicNote} from '#/components/icons/MusicNote'
import {useLink} from '#/components/Link'
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
import {useTealNowPlayingQuery} from '#/deltas/feat/useTealNowPlayingQuery'
import {useDeltasPreferences} from '#/deltas/preferences'
import {IS_NATIVE, IS_WEB} from '#/env'

export function TealNowPlaying({did}: {did: string}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {data, isError} = useTealNowPlayingQuery(did)
  const {showTealNowPlaying} = useDeltasPreferences()
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [, setNow] = useState(Date.now)
  const {href, onPress: openProfile, openExternally} = useLink({
    to: `https://teal.fm/profile/${did}`,
    displayText: '',
  })

  useEffect(() => {
    if (!data) return
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, data.expiresAt - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [data])

  if (!showTealNowPlaying || !data || isError || data.expiresAt <= Date.now()) {
    return null
  }

  const song = data.artists.length
    ? `${data.trackName} - ${data.artists.join(', ')}`
    : data.trackName
  const tooltip = data.releaseName
    ? l`Listening to ${data.releaseName}`
    : l`Listening to ${song}`

  const contents = (
    <Pressable
      testID="profileHeaderTealNowPlaying"
      accessibilityRole={IS_WEB ? 'link' : 'button'}
      accessibilityLabel={tooltip}
      accessibilityHint={
        IS_NATIVE ? l`Tap for listening details. Hold to open teal.fm.` : ''
      }
      onPress={
        IS_WEB ? openProfile : () => setTooltipVisible(visible => !visible)
      }
      onLongPress={
        IS_NATIVE
          ? () => {
              setTooltipVisible(false)
              openExternally()
            }
          : undefined
      }
      {...web({
        href,
        hrefAttrs: {target: 'blank', rel: 'noopener noreferrer'},
        dataSet: {noUnderline: '1', tooltip, tooltipPos: 'top'},
      })}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.flex_shrink,
        {minWidth: 0},
      ]}>
      <MusicNote
        width={tokens.space.lg}
        style={{color: t.atoms.text_contrast_medium.color}}
        aria-hidden
      />
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.flex_1,
          {minWidth: 0},
        ]}>
        <Text
          emoji
          numberOfLines={1}
          style={[
            a.flex_shrink,
            t.atoms.text_contrast_medium,
          ]}>
          {data.trackName}
        </Text>
        {data.artists.length > 0 && (
          <Text
            emoji
            numberOfLines={1}
            style={[
              t.atoms.text_contrast_medium,
              {flexShrink: 0},
            ]}>
            {`\u00a0-\u00a0${data.artists.join(', ')}`}
          </Text>
        )}
      </View>
    </Pressable>
  )

  return IS_NATIVE ? (
    <Tooltip.Outer
      color="primary"
      visible={tooltipVisible}
      onVisibleChange={setTooltipVisible}>
      <Tooltip.Target style={{flexShrink: 1, minWidth: 0, maxWidth: '100%'}}>
        {contents}
      </Tooltip.Target>
      <Tooltip.BubbleText label={tooltip}>{tooltip}</Tooltip.BubbleText>
    </Tooltip.Outer>
  ) : (
    contents
  )
}

import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import {Plural} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import  {type ThemeColorSet} from './types'

export function ThemePreview({
  colorSet,
  colorSets,
  secondaryColorSet,
  special,
  variantCount,
  attachedRight,
  previewHeight,
  aspectRatio = 1.55,
  selected,
  label,
  hideLabel,
  onPress,
  style,
}: {
  colorSet: ThemeColorSet
  colorSets?: ThemeColorSet[]
  secondaryColorSet?: ThemeColorSet
  special?: boolean
  variantCount?: number
  attachedRight?: boolean
  previewHeight?: number
  aspectRatio?: number
  selected?: boolean
  label?: string
  hideLabel?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const c = colorSet.colors
  const previewSets = [
    colorSet,
    ...(colorSets ?? []).filter(set => set.name !== colorSet.name),
    ...(secondaryColorSet ? [secondaryColorSet] : []),
  ].slice(0, 4)
  const lastColors = previewSets.at(-1)?.colors ?? c
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      accessibilityLabel={label ?? colorSet.name}
      accessibilityHint=""
      disabled={!onPress}
      onPress={onPress}
      style={[a.flex_1, {minWidth: 126}, style]}>
      <View
        style={[
          a.rounded_md,
          a.overflow_hidden,
          a.border,
          {
            aspectRatio: previewHeight ? undefined : aspectRatio,
            height: previewHeight,
            backgroundColor: c.canvas,
            borderColor: selected ? c.accent : c.border,
            borderWidth: selected ? 3 : 1,
            borderTopRightRadius: attachedRight ? 0 : undefined,
            borderBottomRightRadius: attachedRight ? 0 : undefined,
          },
        ]}>
        <MiniApp colors={c} />
        {previewSets.slice(1).map((set, index) => {
          const start = ((index + 1) / previewSets.length) * 100
          const remaining = 100 - start
          const overscan = 20
          const clippedWidth = remaining + overscan
          return (
            <View
              key={`${set.name}-${index}`}
              pointerEvents="none"
              style={[
                a.absolute,
                a.overflow_hidden,
                {
                  left: `${start}%`,
                  width: `${clippedWidth}%`,
                  top: 0,
                  height: '100%',
                  backgroundColor: set.colors.canvas,
                  transform: [{skewX: '-13deg'}],
                },
              ]}>
              <View
                style={{
                  position: 'absolute',
                  left: `${(-start / clippedWidth) * 100}%`,
                  top: 0,
                  width: `${(100 / clippedWidth) * 100}%`,
                  height: '100%',
                  transform: [{skewX: '13deg'}],
                }}>
                <MiniApp colors={set.colors} />
              </View>
            </View>
          )
        })}
        {(special || (variantCount ?? 0) > 1) && (
          <View
            pointerEvents="none"
            style={[
              a.absolute,
              a.flex_row,
              a.align_center,
              a.gap_xs,
              {
                right: 7,
                bottom: 7,
              },
            ]}>
            {special && (
              <SparkleIcon size="xs" style={{color: lastColors.text}} />
            )}
            {(variantCount ?? 0) > 1 && (
              <Text style={[a.text_xs, a.font_bold, {color: lastColors.text}]}>
                <Plural value={variantCount ?? 0} other="# variants" />
              </Text>
            )}
          </View>
        )}
        {selected && (
          <View
            style={[
              a.absolute,
              a.rounded_full,
              a.align_center,
              a.justify_center,
              {
                right: 7,
                top: 7,
                width: 22,
                height: 22,
                backgroundColor: lastColors.accent,
              },
            ]}>
            <CheckIcon size="xs" style={{color: lastColors.onAccent}} />
          </View>
        )}
      </View>
      {!hideLabel && (
        <Text
          numberOfLines={1}
          style={[a.text_sm, a.font_bold, a.text_center, a.mt_xs]}>
          {label ?? colorSet.name}
        </Text>
      )}
    </Pressable>
  )
}

function MiniApp({colors: c}: {colors: ThemeColorSet['colors']}) {
  return (
    <View style={[a.flex_1, a.flex_row, {backgroundColor: c.canvas}]}>
      <View style={{width: '27%', backgroundColor: c.surface}}>
        <View
          style={{
            height: 8,
            margin: 8,
            borderRadius: 4,
            backgroundColor: c.accent,
          }}
        />
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={{
              height: 4,
              marginHorizontal: 8,
              marginTop: 6,
              borderRadius: 2,
              backgroundColor: c.textMuted,
            }}
          />
        ))}
      </View>
      <View style={[a.flex_1, {padding: 8}]}>
        <View
          style={{
            height: 7,
            width: '46%',
            borderRadius: 4,
            backgroundColor: c.text,
          }}
        />
        <View
          style={{
            height: 25,
            marginTop: 7,
            borderRadius: 5,
            backgroundColor: c.surfaceRaised,
            borderWidth: 1,
            borderColor: c.border,
          }}
        />
        <View style={[a.flex_row, {gap: 5, marginTop: 7}]}>
          <View
            style={{
              height: 12,
              flex: 1,
              borderRadius: 6,
              backgroundColor: c.accent,
            }}
          />
          <View
            style={{
              height: 12,
              width: 22,
              borderRadius: 6,
              backgroundColor: c.accentSoft,
            }}
          />
        </View>
      </View>
    </View>
  )
}

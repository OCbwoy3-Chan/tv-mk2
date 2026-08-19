import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {DEFAULT_ACTIVE_THEME} from '#/features/themes/catalog'
import {ThemePreview} from '#/features/themes/ThemePreview'
import {
  getColorSet,
  isSupportedTheme,
  type ThemeSelectionMode,
} from '#/features/themes/types'

export function ThemeQuickSelector() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const {activeTheme: storedTheme, colorMode} = useThemePrefs()
  const {setActiveTheme, setColorMode} = useSetThemePrefs()
  const supportedStoredTheme =
    storedTheme &&
    isSupportedTheme(storedTheme.light.record) &&
    isSupportedTheme(storedTheme.dark.record)
      ? storedTheme
      : undefined
  const activeTheme = supportedStoredTheme ?? DEFAULT_ACTIVE_THEME
  const light = getColorSet(
    activeTheme.light.record,
    activeTheme.light.colorSet,
  )
  const dark = getColorSet(activeTheme.dark.record, activeTheme.dark.colorSet)
  const previewHeight = 92
  const items: {
    id: ThemeSelectionMode
    mode: ThemeSelectionMode
    label: string
    set: typeof light
    secondarySet?: typeof dark
  }[] = [
    {
      id: 'light',
      mode: 'light',
      label: activeTheme.light.record.name,
      set: light,
    },
    {
      id: 'dark',
      mode: 'dark',
      label: activeTheme.dark.record.name,
      set: dark,
    },
    {
      id: 'system',
      mode: 'system',
      label: _(msg`System`),
      set: light,
      secondarySet: dark,
    },
  ]

  return (
    <View style={[a.px_lg, a.py_md, a.gap_sm]}>
      <Text style={[a.text_lg, a.font_bold]}>{_(msg`Theme`)}</Text>
      <View style={[a.flex_row, a.flex_wrap, a.gap_md]}>
        {items.map(item => (
          <View
            key={`${item.id}-${Object.values(item.set.colors).join('-')}-${
              item.secondarySet
                ? Object.values(item.secondarySet.colors).join('-')
                : ''
            }`}
            style={[
              {
                flexBasis: gtMobile
                  ? 0
                  : item.mode === 'system'
                    ? '100%'
                    : '46%',
                flexGrow: gtMobile ? 1 : 1,
                minWidth: gtMobile ? 150 : 0,
                maxWidth:
                  gtMobile || item.mode === 'system' ? undefined : '48%',
              },
              web(
                gtMobile
                  ? {}
                  : item.mode === 'system'
                    ? {flexBasis: '100%', maxWidth: '100%'}
                    : {
                        flexBasis: 'calc((100% - 12px) / 2)',
                        maxWidth: 'calc((100% - 12px) / 2)',
                      },
              ),
            ]}>
            <View style={[a.flex_row, a.align_start]}>
              <ThemePreview
                colorSet={item.set}
                secondaryColorSet={item.secondarySet}
                attachedRight={item.mode === 'light' || item.mode === 'dark'}
                previewHeight={previewHeight}
                style={gtMobile ? undefined : {minWidth: 0}}
                label={item.label}
                selected={colorMode === item.mode}
                onPress={() => {
                  if (!supportedStoredTheme)
                    setActiveTheme(DEFAULT_ACTIVE_THEME)
                  setColorMode(item.mode)
                }}
              />
              {(item.mode === 'light' || item.mode === 'dark') && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={_(msg`Browse ${item.label} themes`)}
                  accessibilityHint=""
                  onPress={() => {
                    if (item.mode !== 'system') {
                      navigation.navigate('ThemeGallery', {mode: item.mode})
                    }
                  }}
                  style={({pressed}) => [
                    a.align_center,
                    a.justify_center,
                    {
                      width: 36,
                      height: previewHeight,
                      backgroundColor: t.palette.contrast_50,
                      borderWidth: 1,
                      borderLeftWidth: 0,
                      borderColor: t.palette.contrast_200,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <ChevronIcon size="sm" />
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

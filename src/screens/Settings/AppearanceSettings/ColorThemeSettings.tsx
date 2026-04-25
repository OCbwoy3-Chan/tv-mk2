import {useCallback} from 'react'
import {Pressable, View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {atoms as a, useTheme} from '#/alf'
import {Slider} from '#/components/forms/Slider'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_ANDROID} from '#/env'
import * as SettingsList from '../components/SettingsList'
import {
  ColorSchemeGrid,
  type ColorSchemeName,
  hexToHue,
  hueToHex,
  MATERIAL3_STYLE_OPTIONS,
  useColorSchemes,
} from './shared'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AppearanceColorThemeSettings'
>

export function AppearanceColorThemeSettingsScreen({}: Props) {
  const t = useTheme()
  const colorSchemes = useColorSchemes()

  const {colorScheme, hue, material3Accent, material3Style} = useThemePrefs()
  const {setColorScheme, setHue, setMaterial3Accent, setMaterial3Style} =
    useSetThemePrefs()

  const onChangeScheme = useCallback(
    (value: ColorSchemeName) => {
      setColorScheme(value)
    },
    [setColorScheme],
  )

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Color Theme</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <View style={[a.gap_md, a.px_lg, a.py_sm]}>
            <ColorSchemeGrid
              schemes={colorSchemes}
              selectedScheme={colorScheme}
              onSchemeChange={onChangeScheme}
            />
            {colorScheme === 'material3' && !IS_ANDROID ? (
              <>
                <Text style={[a.flex_1, t.atoms.text_contrast_medium]}>
                  <Trans>Accent hue:</Trans>
                </Text>
                <Slider
                  value={hexToHue(material3Accent)}
                  onValueChange={value => {
                    setMaterial3Accent(hueToHex(value))
                    setHue(0)
                  }}
                  minimumValue={0}
                  maximumValue={360}
                  step={1}
                  debounceFull={true}
                />

                <Text style={[a.flex_1, t.atoms.text_contrast_medium]}>
                  <Trans>Style:</Trans>
                </Text>
                <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                  {MATERIAL3_STYLE_OPTIONS.map(({name, label}) => {
                    const isSelected = material3Style === name

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={name}
                        onPress={() => setMaterial3Style(name)}
                        style={[
                          a.flex_1,
                          a.rounded_sm,
                          a.align_center,
                          a.px_sm,
                          a.py_sm,
                          a.border,
                          {minWidth: '22%'},
                          {
                            borderColor: isSelected
                              ? t.palette.primary_500
                              : t.atoms.border_contrast_low.borderColor,
                            borderWidth: 2,
                            backgroundColor: isSelected
                              ? t.palette.primary_100
                              : t.atoms.bg.backgroundColor,
                          },
                        ]}>
                        <Text
                          style={[
                            a.text_xs,
                            a.font_bold,
                            isSelected
                              ? {color: t.palette.primary_500}
                              : t.atoms.text,
                          ]}>
                          {label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={[a.flex_1, t.atoms.text_contrast_medium]}>
                  <Trans>Hue shift the colors:</Trans>
                </Text>
                <Slider
                  value={hue}
                  onValueChange={setHue}
                  minimumValue={0}
                  maximumValue={360}
                  step={1}
                  debounceFull={true}
                />
              </>
            )}
          </View>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

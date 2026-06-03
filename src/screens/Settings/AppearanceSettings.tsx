import {useCallback} from 'react'
import Animated, {
  FadeInUp,
  FadeOutUp,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  useEnableSquareAvatars,
  useSetEnableSquareAvatars,
} from '#/state/preferences/enable-square-avatars'
import {
  useEnableSquareButtons,
  useSetEnableSquareButtons,
} from '#/state/preferences/enable-square-buttons'
import {
  useRepostCarouselEnabled,
  useSetRepostCarouselEnabled,
} from '#/state/preferences/repost-carousel-enabled'
import {useKawaiiMode, useSetKawaiiMode} from '#/state/preferences/kawaii'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {SettingsListItem as AppIconSettingsListItem} from '#/screens/Settings/AppIconSettings/SettingsListItem'
import {ItemTextWithSubtitle} from '#/screens/Settings/NotificationSettings/components/ItemTextWithSubtitle'
import {type Alf, atoms as a, native, useAlf, useTheme} from '#/alf'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as Toggle from '#/components/forms/Toggle'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPaletteIcon} from '#/components/icons/ColorPalette'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Phone_Stroke2_Corner0_Rounded as PhoneIcon} from '#/components/icons/Phone'
import {Repost_Stroke2_Corner3_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import {Window_Stroke2_Corner2_Rounded as SquareIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_INTERNAL, IS_NATIVE} from '#/env'
import {getColorSchemeLabel, useColorSchemes} from './AppearanceSettings/shared'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>

export function AppearanceSettingsScreen({}: Props) {
  const {_} = useLingui()
  const {fonts} = useAlf()

  const {colorMode, colorScheme, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  const kawaiiMode = useKawaiiMode()
  const setKawaiiMode = useSetKawaiiMode()

  const enableSquareAvatars = useEnableSquareAvatars()
  const setEnableSquareAvatars = useSetEnableSquareAvatars()

  const repostCarouselEnabled = useRepostCarouselEnabled()
  const setRepostCarouselEnabled = useSetRepostCarouselEnabled()

  const enableSquareButtons = useEnableSquareButtons()
  const setEnableSquareButtons = useSetEnableSquareButtons()
  const colorSchemes = useColorSchemes()
  const colorSchemeLabel = getColorSchemeLabel(colorSchemes, colorScheme)

  const onChangeAppearance = useCallback(
    (value: 'light' | 'system' | 'dark') => {
      setColorMode(value)
    },
    [setColorMode],
  )

  const onChangeDarkTheme = useCallback(
    (value: 'dim' | 'dark') => {
      setDarkTheme(value)
    },
    [setDarkTheme],
  )

  const onChangeFontFamily = useCallback(
    (value: 'system' | 'theme' | 'material') => {
      fonts.setFontFamily(value)
    },
    [fonts],
  )

  const onChangeFontScale = useCallback(
    (value: Alf['fonts']['scale']) => {
      fonts.setFontScale(value)
    },
    [fonts],
  )

  return (
    <LayoutAnimationConfig skipExiting skipEntering>
      <Layout.Screen testID="preferencesThreadsScreen">
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Appearance</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content>
          <SettingsList.Container>
            <AppearanceToggleButtonGroup
              title={_(msg`Color mode`)}
              icon={PhoneIcon}
              items={[
                {
                  label: _(msg`System`),
                  name: 'system',
                },
                {
                  label: _(msg`Light`),
                  name: 'light',
                },
                {
                  label: _(msg`Dark`),
                  name: 'dark',
                },
              ]}
              value={colorMode}
              onChange={onChangeAppearance}
            />

            {colorMode !== 'light' && (
              <Animated.View
                entering={native(FadeInUp)}
                exiting={native(FadeOutUp)}>
                <AppearanceToggleButtonGroup
                  title={_(msg`Dark theme`)}
                  icon={MoonIcon}
                  items={[
                    {
                      label: _(msg`Dim`),
                      name: 'dim',
                    },
                    {
                      label: _(msg`Dark`),
                      name: 'dark',
                    },
                  ]}
                  value={darkTheme ?? 'dim'}
                  onChange={onChangeDarkTheme}
                />
              </Animated.View>
            )}

            <SettingsList.LinkItem
              to="/settings/appearance/color-theme"
              label={_(msg`Color theme settings`)}
              contentContainerStyle={[a.align_start]}>
              <SettingsList.ItemIcon icon={ColorPaletteIcon} />
              <ItemTextWithSubtitle
                titleText={<Trans>Color Theme</Trans>}
                subtitleText={colorSchemeLabel}
              />
            </SettingsList.LinkItem>

            <Animated.View layout={native(LinearTransition)}>
              <SettingsList.Divider />

              <AppearanceToggleButtonGroup
                title={_(msg`Font`)}
                description={_(
                  msg`For the best experience, we recommend using the theme font.`,
                )}
                icon={Aa}
                items={[
                  {
                    label: _(msg`System`),
                    name: 'system',
                  },
                  {
                    label: _(msg`Theme`),
                    name: 'theme',
                  },
                  ...(IS_ANDROID
                    ? [
                        {
                          label: _(msg`Google Sans`),
                          name: 'material' as 'system' | 'theme' | 'material',
                        },
                      ]
                    : []),
                ]}
                value={fonts.family}
                onChange={onChangeFontFamily}
              />

              <AppearanceToggleButtonGroup
                title={_(msg`Font size`)}
                icon={TextSize}
                items={[
                  {
                    label: _(msg`Smaller`),
                    name: '-1',
                  },
                  {
                    label: _(msg`Default`),
                    name: '0',
                  },
                  {
                    label: _(msg`Larger`),
                    name: '1',
                  },
                ]}
                value={fonts.scale}
                onChange={onChangeFontScale}
              />
              <Toggle.Item
                name="repost_carousel"
                label={_(msg`Combine reposts into a horizontal carousel`)}
                value={repostCarouselEnabled}
                onChange={value => setRepostCarouselEnabled(value)}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={RepostIcon} />
                  <SettingsList.ItemText>
                    <Trans>Combine reposts into a horizontal carousel</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>

              <SettingsList.Divider />

              <Toggle.Item
                name="kawaii_mode"
                label={_(msg`Enable kawaii logo`)}
                value={kawaiiMode}
                onChange={value => setKawaiiMode(value)}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={SparkleIcon} />
                  <SettingsList.ItemText>
                    <Trans>Enable kawaii logo</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              <Toggle.Item
                name="enable_square_avatars"
                label={_(msg`Enable square avatars`)}
                value={enableSquareAvatars}
                onChange={value => setEnableSquareAvatars(value)}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={PersonIcon} />
                  <SettingsList.ItemText>
                    <Trans>Enable square avatars</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              <Toggle.Item
                name="enable_square_buttons"
                label={_(msg`Enable square buttons`)}
                value={enableSquareButtons}
                onChange={value => setEnableSquareButtons(value)}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={SquareIcon} />
                  <SettingsList.ItemText>
                    <Trans>Enable square buttons</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              {IS_NATIVE && IS_INTERNAL && (
                <>
                  <SettingsList.Divider />
                  <AppIconSettingsListItem />
                </>
              )}
            </Animated.View>
          </SettingsList.Container>
        </Layout.Content>
      </Layout.Screen>
    </LayoutAnimationConfig>
  )
}

export function AppearanceToggleButtonGroup<T extends string>({
  title,
  description,
  icon: Icon,
  items,
  value,
  onChange,
}: {
  title: string
  description?: string
  icon: React.ComponentType<SVGIconProps>
  items: {
    label: string
    name: T
  }[]
  value: T
  onChange: (value: T) => void
}) {
  const t = useTheme()
  return (
    <>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]} iconInset={false}>
        <SettingsList.ItemIcon icon={Icon} />
        <SettingsList.ItemText>{title}</SettingsList.ItemText>
        {description && (
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.w_full,
            ]}>
            {description}
          </Text>
        )}
        <SegmentedControl.Root
          type="radio"
          label={title}
          value={value}
          onChange={onChange}>
          {items.map(item => (
            <SegmentedControl.Item
              key={item.name}
              label={item.label}
              value={item.name}>
              <SegmentedControl.ItemText>
                {item.label}
              </SegmentedControl.ItemText>
            </SegmentedControl.Item>
          ))}
        </SegmentedControl.Root>
      </SettingsList.Group>
    </>
  )
}

import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import Animated, {
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
  useHideDisplayNames,
  useSetHideDisplayNames,
} from '#/state/preferences/hide-display-names'
import {useKawaiiMode, useSetKawaiiMode} from '#/state/preferences/kawaii'
import {
  useRepostCarouselEnabled,
  useSetRepostCarouselEnabled,
} from '#/state/preferences/repost-carousel-enabled'
import {useSession} from '#/state/session'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {ItemTextWithSubtitle} from '#/screens/Settings/NotificationSettings/components/ItemTextWithSubtitle'
import {type Alf, atoms as a, native, useAlf, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as Toggle from '#/components/forms/Toggle'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner3_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import {Window_Stroke2_Corner2_Rounded as SquareIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_ANDROID} from '#/env'
import {useActiveThemeUpdate, useSaveTheme} from '#/features/themes/api'
import {
  type ActiveTheme,
  getColorSets,
  type ThemeView,
} from '#/features/themes/types'
import {ThemeQuickSelector} from './AppearanceSettings/ThemeQuickSelector'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>

export function AppearanceSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {fonts} = useAlf()
  const {currentAccount} = useSession()

  const {activeTheme} = useThemePrefs()
  const {setActiveTheme} = useSetThemePrefs()
  const availableUpdate = useActiveThemeUpdate(activeTheme)
  const saveTheme = useSaveTheme()
  const [preview, setPreview] = useState<{
    previous: ActiveTheme
    next: ActiveTheme
    theme: ThemeView
    seconds: number
  }>()

  const kawaiiMode = useKawaiiMode()
  const setKawaiiMode = useSetKawaiiMode()

  const enableSquareAvatars = useEnableSquareAvatars()
  const setEnableSquareAvatars = useSetEnableSquareAvatars()

  const repostCarouselEnabled = useRepostCarouselEnabled()
  const setRepostCarouselEnabled = useSetRepostCarouselEnabled()

  const enableSquareButtons = useEnableSquareButtons()
  const setEnableSquareButtons = useSetEnableSquareButtons()

  const hideDisplayNames = useHideDisplayNames()
  const setHideDisplayNames = useSetHideDisplayNames()

  useEffect(() => {
    if (!preview) return
    const interval = setInterval(() => {
      setPreview(current => {
        if (!current) return
        if (current.seconds <= 1) {
          setActiveTheme(current.previous)
          return undefined
        }
        return {...current, seconds: current.seconds - 1}
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [preview, setActiveTheme])

  const startUpdatePreview = useCallback(
    (mode: 'light' | 'dark', update: ThemeView) => {
      if (!activeTheme) return
      const next: ActiveTheme = {
        ...activeTheme,
        [mode]: {
          ...update,
          colorSet:
            getColorSets(update.record).find(
              set => set.name === activeTheme[mode].colorSet,
            )?.name ?? update.record.base.name,
        },
      }
      setActiveTheme(next)
      setPreview({previous: activeTheme, next, theme: update, seconds: 15})
    },
    [activeTheme, setActiveTheme],
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
            <ThemeQuickSelector />

            {availableUpdate && !preview && (
              <SettingsList.Item style={[a.gap_md]}>
                <View
                  style={[
                    a.rounded_full,
                    {width: 9, height: 9, backgroundColor: '#f04f46'},
                  ]}
                />
                <ItemTextWithSubtitle
                  titleText={
                    availableUpdate.mode === 'light' ? (
                      <Trans>Light theme update available</Trans>
                    ) : (
                      <Trans>Dark theme update available</Trans>
                    )
                  }
                  subtitleText={_(
                    msg`Preview the creator's latest colors before applying them.`,
                  )}
                />
                <Button
                  label={_(msg`Keep current theme colors`)}
                  size="small"
                  color="secondary"
                  onPress={() => {
                    if (!activeTheme) return
                    const current = activeTheme[availableUpdate.mode]
                    const kept: ActiveTheme = {
                      ...activeTheme,
                      [availableUpdate.mode]: {
                        ...current,
                        cid: availableUpdate.theme.cid,
                      },
                    }
                    setActiveTheme(kept)
                    if (currentAccount) {
                      saveTheme.mutate({
                        ...availableUpdate.theme,
                        record: current.record,
                      })
                    }
                  }}>
                  <ButtonText>
                    <Trans>Keep old</Trans>
                  </ButtonText>
                </Button>
                <Button
                  label={_(msg`Preview theme update`)}
                  size="small"
                  color="primary"
                  onPress={() =>
                    startUpdatePreview(
                      availableUpdate.mode,
                      availableUpdate.theme,
                    )
                  }>
                  <ButtonText>
                    <Trans>Preview</Trans>
                  </ButtonText>
                </Button>
              </SettingsList.Item>
            )}

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

              <SettingsList.Divider />

              <Toggle.Item
                name="hide_display_names"
                label={_(msg`Hide display names`)}
                value={hideDisplayNames}
                onChange={value => setHideDisplayNames(value)}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={AtIcon} />
                  <SettingsList.ItemText>
                    <Trans>Hide display names</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>

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
            </Animated.View>
          </SettingsList.Container>
        </Layout.Content>
        {preview && (
          <View
            style={[
              a.absolute,
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.p_md,
              a.rounded_md,
              t.atoms.bg_contrast_50,
              t.atoms.border_contrast_low,
              a.border,
              {left: 12, right: 12, bottom: 12},
            ]}>
            <Text style={[a.flex_1, a.font_bold]}>
              <Trans>Testing update · {preview.seconds}s</Trans>
            </Text>
            <Button
              label={_(msg`Revert theme update`)}
              size="small"
              color="secondary"
              onPress={() => {
                setActiveTheme(preview.previous)
                setPreview(undefined)
              }}>
              <ButtonText>
                <Trans>Revert</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_(msg`Apply theme update`)}
              size="small"
              color="primary"
              onPress={() => {
                saveTheme.mutate(preview.theme)
                setPreview(undefined)
              }}>
              <ButtonText>
                <Trans>Apply</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
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

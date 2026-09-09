import {useEffect, useMemo, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import {useThemePrefs} from '#/state/shell'
import {atoms as a, useTheme} from '#/alf'
import {useMaterialYouPalette} from '#/alf/util/materialYou'
import {Button, ButtonText} from '#/components/Button'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {usePublishTheme, useThemeRecord} from '#/features/themes/api'
import {DEFAULT_ACTIVE_THEME, FEATURED_THEMES} from '#/features/themes/catalog'
import {resolveHueRecord} from '#/features/themes/hue'
import {resolveMaterialYouRecord} from '#/features/themes/materialYou'
import {ThemePreview} from '#/features/themes/ThemePreview'
import {
  getColorSet,
  getColorSets,
  isMaterialYouTheme,
  type SemanticColors,
  type ThemeMode,
  type ThemeRecord,
  themeRkey,
} from '#/features/themes/types'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ThemeEditor'>

const COLOR_ROLES: {key: keyof SemanticColors; label: string; help: string}[] =
  [
    {key: 'canvas', label: 'Canvas', help: 'App background'},
    {key: 'surface', label: 'Surface', help: 'Cards and controls'},
    {key: 'surfaceRaised', label: 'Raised surface', help: 'Menus and overlays'},
    {key: 'text', label: 'Text', help: 'Primary content'},
    {key: 'textMuted', label: 'Muted text', help: 'Metadata and hints'},
    {key: 'border', label: 'Border', help: 'Dividers and outlines'},
    {key: 'accent', label: 'Accent', help: 'Links and primary actions'},
    {key: 'accentSoft', label: 'Soft accent', help: 'Selected backgrounds'},
    {key: 'onAccent', label: 'On accent', help: 'Content on accent'},
    {key: 'positive', label: 'Positive', help: 'Success states'},
    {key: 'warning', label: 'Warning', help: 'Caution states'},
    {
      key: 'critical',
      label: 'Critical',
      help: 'Errors and destructive actions',
    },
    {key: 'favorite', label: 'Favorite', help: 'Likes and favorites'},
  ]

function initialRecord(
  source: ThemeRecord,
  preferredColorSet?: string,
): ThemeRecord {
  const materialYou = isMaterialYouTheme(source)
  const selected = getColorSet(source, preferredColorSet)
  return {
    ...source,
    $type: 'app.witchsky.theme.colors',
    name: 'Untitled theme',
    description: '',
    recommendedPair: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
    special: undefined,
    base:
      materialYou && selected
        ? {...selected, colors: {...selected.colors}}
        : {...source.base, colors: {...source.base.colors}},
    variants: materialYou
      ? undefined
      : source.variants?.map(variant => ({
          ...variant,
          colors: variant.colors ? {...variant.colors} : undefined,
        })),
  }
}

function editableRecord(source: ThemeRecord): ThemeRecord {
  return {
    ...source,
    base: {...source.base, colors: {...source.base.colors}},
    variants: source.variants?.map(variant => ({
      ...variant,
      colors: variant.colors ? {...variant.colors} : undefined,
    })),
  }
}

export function ThemeEditorScreen({route, navigation}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const materialPalette = useMaterialYouPalette()
  const {currentAccount} = useSession()
  const {activeTheme: storedActiveTheme} = useThemePrefs()
  const activeTheme = storedActiveTheme ?? DEFAULT_ACTIVE_THEME
  const initialMode = route.params.mode ?? 'light'
  const remixActive = route.params.remix
    ? ([activeTheme.light, activeTheme.dark].find(
        theme =>
          theme.author === route.params.remix?.name &&
          theme.uri.endsWith(`/${route.params.remix.rkey}`),
      ) ?? undefined)
    : undefined
  const remixLocal = route.params.remix
    ? FEATURED_THEMES.find(
        theme =>
          theme.author === route.params.remix?.name &&
          theme.uri.endsWith(`/${route.params.remix.rkey}`),
      )
    : undefined
  const existing = useThemeRecord(
    remixActive || remixLocal
      ? undefined
      : (route.params.remix?.name ?? currentAccount?.did),
    remixActive || remixLocal
      ? undefined
      : (route.params.remix?.rkey ?? route.params.rkey),
  )
  const publish = usePublishTheme()
  const [record, setRecord] = useState(() =>
    initialRecord(
      activeTheme[initialMode].record,
      activeTheme[initialMode].colorSet,
    ),
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const sourceView = remixActive ?? remixLocal ?? existing.data
    let source = sourceView?.record
    if (source) {
      const activeSource = [activeTheme.light, activeTheme.dark].find(
        selection => selection.uri === sourceView?.uri,
      )
      source = resolveHueRecord(source, activeSource?.hue ?? 0)
      if (isMaterialYouTheme(source)) {
        source = resolveMaterialYouRecord(
          source,
          materialPalette,
          source.special.accent,
          IS_WEB,
        )
      }
      setRecord(
        route.params.remix
          ? initialRecord(
              source,
              route.params.remix.colorSet ?? remixActive?.colorSet,
            )
          : editableRecord(source),
      )
      setSelectedIndex(0)
    }
  }, [
    existing.data,
    activeTheme,
    materialPalette,
    remixActive,
    remixLocal,
    route.params.remix,
  ])

  const colorSets = getColorSets(record)
  const selected = colorSets[selectedIndex] ?? colorSets[0]
  const canDelete = selectedIndex > 0
  const valid = useMemo(
    () =>
      record.name.trim().length > 0 &&
      Object.values(record.base.colors).every(color =>
        /^#[0-9a-f]{6}$/i.test(color),
      ) &&
      (record.variants ?? []).every(variant =>
        Object.values(variant.colors ?? {}).every(color =>
          /^#[0-9a-f]{6}$/i.test(color),
        ),
      ),
    [record],
  )

  const updateSelectedName = (name: string) => {
    setRecord(current =>
      selectedIndex === 0
        ? {...current, base: {...current.base, name}}
        : {
            ...current,
            variants: (current.variants ?? []).map((variant, index) =>
              index === selectedIndex - 1 ? {...variant, name} : variant,
            ),
          },
    )
  }

  const updateColor = (key: keyof SemanticColors, value: string) => {
    setRecord(current => {
      if (selectedIndex === 0) {
        return {
          ...current,
          base: {
            ...current.base,
            colors: {...current.base.colors, [key]: value},
          },
        }
      }
      return {
        ...current,
        variants: (current.variants ?? []).map((variant, index) => {
          if (index !== selectedIndex - 1) return variant
          const colors = {...variant.colors}
          if (value) colors[key] = value
          else delete colors[key]
          return {...variant, colors}
        }),
      }
    })
  }

  const addSet = () => {
    const next = {name: `${selected.name} variant`, colors: {}}
    setRecord(current => ({
      ...current,
      variants: [...(current.variants ?? []), next],
    }))
    setSelectedIndex(colorSets.length)
  }

  const save = async () => {
    if (!valid || !currentAccount) {
      setError(_(msg`Enter valid colors for the base theme and its overrides.`))
      return
    }
    setError(undefined)
    try {
      const now = new Date().toISOString()
      const result = await publish.mutateAsync({
        rkey: route.params.remix ? undefined : route.params.rkey,
        record: {
          ...record,
          $type: 'app.witchsky.theme.colors',
          name: record.name.trim(),
          description: record.description?.trim() || undefined,
          updatedAt: now,
        },
      })
      navigation.replace('Theme', {
        name: currentAccount.handle || currentAccount.did,
        rkey: themeRkey(result.uri),
      })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : _(msg`Could not save theme.`),
      )
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Theme editor</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content contentContainerStyle={[a.py_lg, a.pb_5xl]}>
        <View style={[a.px_xl, a.gap_xl]}>
          <View style={[a.gap_sm]}>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Theme name</Trans>
            </Text>
            <TextField.Input
              label={_(msg`Theme name`)}
              value={record.name}
              onChangeText={name => setRecord(current => ({...current, name}))}
            />
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Appearance mode</Trans>
            </Text>
            <SegmentedControl.Root
              type="radio"
              label={_(msg`Light or dark mode`)}
              value={record.mode}
              onChange={(mode: ThemeMode) =>
                setRecord(current => ({...current, mode}))
              }>
              <SegmentedControl.Item label={_(msg`Light`)} value="light">
                <SegmentedControl.ItemText>
                  <Trans>Light</Trans>
                </SegmentedControl.ItemText>
              </SegmentedControl.Item>
              <SegmentedControl.Item label={_(msg`Dark`)} value="dark">
                <SegmentedControl.ItemText>
                  <Trans>Dark</Trans>
                </SegmentedControl.ItemText>
              </SegmentedControl.Item>
            </SegmentedControl.Root>
            <Text style={[a.text_sm, a.font_bold]}>
              <Trans>Description</Trans>
            </Text>
            <TextField.Input
              label={_(msg`Description`)}
              value={record.description ?? ''}
              multiline
              onChangeText={description =>
                setRecord(current => ({...current, description}))
              }
            />
          </View>

          <View style={[a.gap_md]}>
            <View style={[a.flex_row, a.align_center, a.justify_between]}>
              <View>
                <Text style={[a.text_xl, a.font_bold]}>
                  <Trans>Base and variants</Trans>
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  <Trans>
                    The base defines every color. Variants only override the
                    colors you change.
                  </Trans>
                </Text>
              </View>
              <Button
                label={_(msg`Add subtheme`)}
                size="small"
                color="secondary"
                onPress={addSet}>
                <ButtonText>
                  <Trans>Add</Trans>
                </ButtonText>
              </Button>
            </View>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
              {colorSets.map((set, index) => (
                <Pressable
                  key={`${set.name}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={_(msg`Edit ${set.name} subtheme`)}
                  accessibilityHint=""
                  onPress={() => setSelectedIndex(index)}
                  style={[
                    a.rounded_full,
                    a.px_md,
                    a.py_sm,
                    index === selectedIndex
                      ? {backgroundColor: t.palette.primary_100}
                      : t.atoms.bg_contrast_50,
                  ]}>
                  <Text
                    style={[
                      a.font_bold,
                      index === selectedIndex && {color: t.palette.primary_500},
                    ]}>
                    {set.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {selected && (
            <View style={[a.gap_lg]}>
              <View style={[a.flex_row, a.flex_wrap, a.gap_lg, a.align_start]}>
                <View style={[a.flex_1, a.gap_sm, {minWidth: 230}]}>
                  <Text style={[a.text_sm, a.font_bold]}>
                    {selectedIndex === 0 ? (
                      <Trans>Base name</Trans>
                    ) : (
                      <Trans>Variant name</Trans>
                    )}
                  </Text>
                  <TextField.Input
                    label={
                      selectedIndex === 0
                        ? _(msg`Base name`)
                        : _(msg`Variant name`)
                    }
                    value={selected.name}
                    onChangeText={updateSelectedName}
                  />
                </View>
                <ThemePreview colorSet={selected} style={{maxWidth: 280}} />
              </View>

              <View style={[a.flex_row, a.flex_wrap, a.gap_md]}>
                {COLOR_ROLES.map(role => (
                  <View
                    key={role.key}
                    style={[a.flex_1, a.gap_xs, {minWidth: 220}]}>
                    <View
                      style={[a.flex_row, a.align_center, a.justify_between]}>
                      <View>
                        <Text style={[a.font_bold]}>{role.label}</Text>
                        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                          {role.help}
                        </Text>
                      </View>
                      <View
                        style={[
                          a.rounded_full,
                          a.border,
                          {
                            width: 28,
                            height: 28,
                            backgroundColor: selected.colors[role.key],
                            borderColor: t.palette.contrast_200,
                          },
                        ]}
                      />
                    </View>
                    <TextField.Input
                      label={role.label}
                      value={
                        selectedIndex === 0
                          ? record.base.colors[role.key]
                          : (record.variants?.[selectedIndex - 1]?.colors?.[
                              role.key
                            ] ?? '')
                      }
                      placeholder={
                        selectedIndex === 0
                          ? undefined
                          : `Inherited: ${record.base.colors[role.key]}`
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                      isInvalid={
                        selectedIndex === 0
                          ? !/^#[0-9a-f]{6}$/i.test(
                              record.base.colors[role.key],
                            )
                          : Boolean(
                              record.variants?.[selectedIndex - 1]?.colors?.[
                                role.key
                              ] &&
                              !/^#[0-9a-f]{6}$/i.test(
                                record.variants?.[selectedIndex - 1]?.colors?.[
                                  role.key
                                ] ?? '',
                              ),
                            )
                      }
                      onChangeText={value => updateColor(role.key, value)}
                    />
                  </View>
                ))}
              </View>

              {canDelete && (
                <Button
                  label={_(msg`Delete subtheme`)}
                  size="small"
                  color="negative_subtle"
                  onPress={() => {
                    setRecord(current => ({
                      ...current,
                      variants: (current.variants ?? []).filter(
                        (_, index) => index !== selectedIndex - 1,
                      ),
                    }))
                    setSelectedIndex(Math.max(0, selectedIndex - 1))
                  }}>
                  <ButtonText>
                    <Trans>Delete subtheme</Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          )}

          <View style={[a.gap_sm]}>
            <Text style={[a.text_lg, a.font_bold]}>
              <Trans>Paired theme</Trans>
            </Text>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>
                Optional. After publishing a theme for the opposite appearance
                mode, paste its AT URI here so people can use the two together.
              </Trans>
            </Text>
            <TextField.Input
              label={_(msg`Opposite-mode theme AT URI`)}
              value={record.recommendedPair ?? ''}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={recommendedPair =>
                setRecord(current => ({
                  ...current,
                  recommendedPair: recommendedPair || undefined,
                }))
              }
            />
          </View>

          {error && (
            <Text style={[{color: t.palette.negative_500}]}>{error}</Text>
          )}
          <Button
            label={_(msg`Publish theme`)}
            size="large"
            color="primary"
            disabled={publish.isPending}
            onPress={() => void save()}>
            <ButtonText>
              {publish.isPending ? (
                <Trans>Saving…</Trans>
              ) : (
                <Trans>Publish theme</Trans>
              )}
            </ButtonText>
          </Button>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

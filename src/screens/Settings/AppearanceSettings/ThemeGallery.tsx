import {View} from 'react-native'
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
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {useThemeLibrary} from '#/features/themes/api'
import {DEFAULT_ACTIVE_THEME, FEATURED_THEMES} from '#/features/themes/catalog'
import {resolveHueRecord} from '#/features/themes/hue'
import {
  materialYouSetForStyle,
  resolveMaterialYouRecord,
} from '#/features/themes/materialYou'
import {ThemeCard} from '#/features/themes/ThemeCard'
import {
  FEATURED_THEME_COLLECTION_URI,
  isMaterialYouTheme,
  isSupportedTheme,
  type ThemeMode,
  type ThemeView,
} from '#/features/themes/types'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ThemeGallery'>

export function ThemeGalleryScreen({route, navigation}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const library = useThemeLibrary()
  const {currentAccount} = useSession()
  const materialPalette = useMaterialYouPalette()
  const {activeTheme, material3Accent, material3Style} = useThemePrefs()
  const displayMode: ThemeMode =
    route.params.mode === 'light' ? 'light' : 'dark'
  const effectiveActiveTheme =
    activeTheme &&
    isSupportedTheme(activeTheme.light.record) &&
    isSupportedTheme(activeTheme.dark.record)
      ? activeTheme
      : DEFAULT_ACTIVE_THEME
  const activeSelection = effectiveActiveTheme[displayMode]

  const forMode = (items: typeof FEATURED_THEMES) =>
    items.filter(theme => theme.record.mode === displayMode)
  const resolveTheme = <T extends ThemeView>(theme: T): T => ({
    ...theme,
    record: resolveHueRecord(
      resolveMaterialYouRecord(
        theme.record,
        materialPalette,
        material3Accent,
        IS_WEB,
      ),
      theme.uri === activeSelection?.uri ? (activeSelection.hue ?? 0) : 0,
    ),
  })
  const saved = forMode(library.data?.saved ?? []).map(resolveTheme)
  const own = forMode(library.data?.own ?? []).map(resolveTheme)
  const remoteCollections = library.data?.featuredCollections ?? [
    {
      uri: FEATURED_THEME_COLLECTION_URI,
      name: 'Featured themes',
      themes: FEATURED_THEMES,
    },
  ]
  const collectionSections = remoteCollections
    .map(collection => ({
      title:
        collection.uri === FEATURED_THEME_COLLECTION_URI
          ? _(msg`Featured`)
          : collection.name,
      items: forMode(collection.themes).map(resolveTheme),
    }))
    .filter(section => section.items.length)
  const listedThemeUris = new Set(
    [
      ...saved,
      ...own,
      ...collectionSections.flatMap(section => section.items),
    ].map(theme => theme.uri),
  )
  const active =
    activeSelection && !listedThemeUris.has(activeSelection.uri)
      ? [resolveTheme({...activeSelection, source: 'saved' as const})]
      : []
  const sections = [
    ...(active.length ? [{title: _(msg`Active`), items: active}] : []),
    ...(saved.length ? [{title: _(msg`Saved`), items: saved}] : []),
    ...(own.length ? [{title: _(msg`Your themes`), items: own}] : []),
    ...collectionSections,
  ]
  const savedByUri = new Map(
    (library.data?.saved ?? []).map(theme => [theme.uri, theme.savedRecordUri]),
  )

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {route.params.mode === 'system' ? (
              <Trans>Automatic themes</Trans>
            ) : displayMode === 'light' ? (
              <Trans>Light themes</Trans>
            ) : (
              <Trans>Dark themes</Trans>
            )}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {currentAccount ? (
          <Button
            label={_(msg`Create theme`)}
            size="small"
            color="primary"
            onPress={() =>
              navigation.navigate('ThemeEditor', {mode: displayMode})
            }>
            <ButtonText>
              <Trans>Create</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Layout.Header.Slot />
        )}
      </Layout.Header.Outer>
      <Layout.Content contentContainerStyle={[a.pb_5xl]}>
        {currentAccount && library.isLoading ? (
          <View
            style={[
              a.flex_1,
              a.align_center,
              a.justify_center,
              {minHeight: 360},
            ]}>
            <Loader size="xl" />
          </View>
        ) : library.isError ? (
          <Text style={[a.p_lg, t.atoms.text_contrast_medium]}>
            <Trans>
              Your repo library could not be loaded. Featured themes are still
              available.
            </Trans>
          </Text>
        ) : null}
        {(!currentAccount || !library.isLoading) && (
          <View style={[a.px_xl, a.py_lg, a.gap_2xl]}>
            {sections.map(section => (
              <View key={section.title} style={[a.gap_md]}>
                <Text style={[a.text_xl, a.font_bold]}>{section.title}</Text>
                <View style={[a.flex_row, a.flex_wrap, a.gap_lg]}>
                  {[...section.items]
                    .sort((a, b) =>
                      isMaterialYouTheme(a.record)
                        ? -1
                        : isMaterialYouTheme(b.record)
                          ? 1
                          : a.uri === activeSelection?.uri
                            ? -1
                            : b.uri === activeSelection?.uri
                              ? 1
                              : 0,
                    )
                    .map(theme => (
                      <ThemeCard
                        key={`${section.title}-${theme.uri}-${
                          theme.record.base.colors.accent
                        }-${theme.record.base.colors.canvas}`}
                        theme={theme}
                        selectedSetName={
                          theme.uri === activeSelection?.uri
                            ? activeSelection.colorSet
                            : isMaterialYouTheme(theme.record)
                              ? materialYouSetForStyle(material3Style)
                              : undefined
                        }
                        selected={theme.uri === activeSelection?.uri}
                        savedRecordUri={savedByUri.get(theme.uri)}
                      />
                    ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}

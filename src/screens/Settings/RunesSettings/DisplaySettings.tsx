import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {dynamicActivate} from '#/locale/i18n'
import {dynamicActivate as dynamicActivateWeb} from '#/locale/i18n.web'
import {type AppLanguage} from '#/locale/languages'
import {
  useAlsoLikedCollapseByDefault,
  useAlsoLikedFeedEnabled,
} from '#/state/preferences'
import {useAutoCompactAccountSwitcher} from '#/state/preferences/auto-compact-account-switcher'
import {useCompactAccountSwitcher} from '#/state/preferences/compact-account-switcher'
import {
  useHighQualityImages,
  useSetHighQualityImages,
} from '#/state/preferences/high-quality-images'
import {
  usePostReplacement,
  useSetPostReplacement,
} from '#/state/preferences/post-name-replacement'
import {
  useRepostCarouselEnabled,
  useSetRepostCarouselEnabled,
} from '#/state/preferences/repost-carousel-enabled'
import {
  useSetShowViaClient,
  useShowViaClient,
} from '#/state/preferences/show-via-client'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Pencil_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner3_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {ItemTextWithSubtitle} from '../NotificationSettings/components/ItemTextWithSubtitle'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesDisplaySettingsScreen() {
  const {t: l} = useLingui()

  const repostCarouselEnabled = useRepostCarouselEnabled()
  const setRepostCarouselEnabled = useSetRepostCarouselEnabled()

  const alsoLikedFeedEnabled = useAlsoLikedFeedEnabled()
  const alsoLikedCollapseByDefault = useAlsoLikedCollapseByDefault()

  const highQualityImages = useHighQualityImages()
  const setHighQualityImages = useSetHighQualityImages()

  const showViaClient = useShowViaClient()
  const setShowViaClient = useSetShowViaClient()

  const setPostReplacementDialogControl = Dialog.useDialogControl()

  return (
    <RunesScreenLayout titleText={l`Display`}>
      <SettingsList.LinkItem
        to="/settings/runes/display/also-liked"
        label={l`Also liked`}
        contentContainerStyle={[a.align_start]}>
        <SettingsList.ItemIcon icon={HeartIcon} />
        <ItemTextWithSubtitle
          titleText={<Trans>Also liked</Trans>}
          subtitleText={
            <AlsoLikedDeclaration
              enabled={alsoLikedFeedEnabled}
              collapseByDefault={alsoLikedCollapseByDefault}
            />
          }
        />
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings/runes/display/density"
        label={l`Density`}
        contentContainerStyle={[a.align_start]}>
        <SettingsList.ItemIcon icon={PersonGroupIcon} />
        <ItemTextWithSubtitle
          titleText={<Trans>Density</Trans>}
          subtitleText={<AccountSwitcherDeclaration />}
        />
      </SettingsList.LinkItem>
      <Toggle.Item
        name="repost_carousel"
        label={l`Combine reposts into a horizontal carousel`}
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
      <Toggle.Item
        name="high_quality_images"
        label={l`Display images in higher quality`}
        value={highQualityImages}
        onChange={value => setHighQualityImages(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={ImageIcon} />
          <SettingsList.ItemText>
            <Trans>Display images in higher quality</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <Admonition type="info" style={[a.flex_1]}>
          <Trans>
            Images will be served as PNG instead of WEBP. Images will take
            longer to load and use more bandwidth.
          </Trans>
        </Admonition>
      </SettingsList.Item>
      <Toggle.Item
        name="show_via_client"
        label={l`Show client used to post`}
        value={showViaClient}
        onChange={value => setShowViaClient(value)}>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={WindowIcon} />
          <SettingsList.ItemText>
            <Trans>Show client used to post</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={PencilIcon} />
        <SettingsList.ItemText>
          <Trans>{`Custom post phrase`}</Trans>
        </SettingsList.ItemText>
        <SettingsList.BadgeButton
          label={l`Change`}
          onPress={() => setPostReplacementDialogControl.open()}
        />
      </SettingsList.Item>
      <PostReplacementDialog control={setPostReplacementDialogControl} />
    </RunesScreenLayout>
  )
}

function AlsoLikedDeclaration({
  enabled,
  collapseByDefault,
}: {
  enabled: boolean
  collapseByDefault: boolean
}) {
  if (!enabled) {
    return <Trans>Hidden in thread views</Trans>
  }

  if (collapseByDefault) {
    return <Trans>Shown in thread views, collapsed by default</Trans>
  }

  return <Trans>Shown in thread views, expanded by default</Trans>
}

function AccountSwitcherDeclaration() {
  const compactAccountSwitcher = useCompactAccountSwitcher()
  const autoCompactAccountSwitcher = useAutoCompactAccountSwitcher()

  if (compactAccountSwitcher) {
    return <Trans>Compact always on</Trans>
  }

  if (autoCompactAccountSwitcher) {
    return <Trans>Auto-compact with 7+ accounts</Trans>
  }

  return <Trans>Default layout only</Trans>
}

function PostReplacementDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {t: l, i18n} = useLingui()

  const postReplacement = usePostReplacement()
  const setPostReplacement = useSetPostReplacement()

  const [singular, setSingular] = useState(postReplacement.postName)
  const [plural, setPlural] = useState(postReplacement.postsName)
  const [pluralManuallyEdited, setPluralManuallyEdited] = useState(false)
  const [singularInputVersion, setSingularInputVersion] = useState(0)
  const [pluralInputVersion, setPluralInputVersion] = useState(0)

  const syncInputValues = (
    nextSingular: string,
    nextPlural: string,
    manuallyEdited = false,
  ) => {
    setSingular(nextSingular)
    setPlural(nextPlural)
    setPluralManuallyEdited(manuallyEdited)
    setSingularInputVersion(version => version + 1)
    setPluralInputVersion(version => version + 1)
  }

  const submit = async () => {
    setPostReplacement({
      enabled: singular.trim().toLowerCase() !== 'post',
      postName: singular,
      postsName: plural,
    })

    const locale = i18n.locale
    await (IS_WEB
      ? dynamicActivateWeb(locale as AppLanguage)
      : dynamicActivate(locale as AppLanguage))

    control.close()
  }

  const handleSingularChange = (value: string) => {
    setSingular(value)
    if (!pluralManuallyEdited) {
      setPlural(`${value}s`)
      setPluralInputVersion(version => version + 1)
    }
  }

  const handlePluralChange = (value: string) => {
    setPlural(value)
    setPluralManuallyEdited(true)
  }

  const handlePresetSelect = (singularForm: string, pluralForm: string) => {
    syncInputValues(singularForm, pluralForm)
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() =>
        syncInputValues(postReplacement.postName, postReplacement.postsName)
      }>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Custom post phrase`}>
        <Text style={[a.text_2xl, a.font_bold, a.pb_lg]}>
          <Trans>Custom post phrase</Trans>
        </Text>

        <View style={a.gap_lg}>
          <Dialog.Input
            key={`post-replacement-singular-input-${singularInputVersion}`}
            label="Singular form"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={handleSingularChange}
            placeholder="skeet"
            placeholderTextColor={pal.colors.textLight}
            accessibilityHint={l`Input the singular form (e.g., "skeet")`}
            defaultValue={singular}
          />
          <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
            {[
              {singular: 'post', plural: 'posts'},
              {singular: 'skeet', plural: 'skeets'},
              {singular: 'note', plural: 'notes'},
              {singular: 'woot', plural: 'woots'},
              {singular: 'toot', plural: 'toots'},
              {singular: 'silly', plural: 'sillies'},
            ].map(preset => (
              <Button
                key={preset.singular}
                variant="ghost"
                color="primary"
                label={preset.singular}
                style={[a.px_sm, a.py_xs, a.rounded_sm]}
                onPress={() =>
                  handlePresetSelect(preset.singular, preset.plural)
                }>
                <ButtonText>{preset.singular}</ButtonText>
              </Button>
            ))}
          </View>
          <Dialog.Input
            key={`post-replacement-plural-input-${pluralInputVersion}`}
            label="Plural form"
            style={[styles.textInput, pal.border, pal.text, a.mt_lg]}
            onChangeText={handlePluralChange}
            placeholder="skeets"
            placeholderTextColor={pal.colors.textLight}
            accessibilityHint={l`Input the plural form (e.g., "skeets")`}
            defaultValue={plural}
          />

          <View style={IS_WEB && [a.flex_row, a.justify_end, a.pt_lg]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => void submit()}
              variant="solid"
              color="primary"
              disabled={!singular.trim() || !plural.trim()}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

const styles = {
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
}

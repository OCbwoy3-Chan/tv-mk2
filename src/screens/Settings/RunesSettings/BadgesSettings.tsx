import {useState} from 'react'
import {View} from 'react-native'
import {type ProfileViewBasic} from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import {Trans, useLingui} from '@lingui/react/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import * as persisted from '#/state/persisted'
import {
  useDeerVerificationEnabled,
  useDeerVerificationTrusted,
  useSetDeerVerificationEnabled,
} from '#/state/preferences/deer-verification'
import {
  useFaviconService,
  useSetFaviconService,
} from '#/state/preferences/favicon-service'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  usePdsLabelEnabled,
  usePdsLabelHideBskyPds,
  useSetPdsLabelEnabled,
  useSetPdsLabelHideBskyPds,
} from '#/state/preferences/pds-label'
import {useProfilesQuery} from '#/state/queries/profile'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Star_Stroke2_Corner0_Rounded as StarIcon} from '#/components/icons/Star'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {SearchProfileCard} from '../../Search/components/SearchProfileCard'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesBadgesSettingsScreen() {
  const {t: l} = useLingui()

  const deerVerificationEnabled = useDeerVerificationEnabled()
  const setDeerVerificationEnabled = useSetDeerVerificationEnabled()
  const setTrustedVerifiersDialogControl = Dialog.useDialogControl()

  const pdsLabelEnabled = usePdsLabelEnabled()
  const setPdsLabelEnabled = useSetPdsLabelEnabled()
  const pdsLabelHideBskyPds = usePdsLabelHideBskyPds()
  const setPdsLabelHideBskyPds = useSetPdsLabelHideBskyPds()
  const setFaviconServiceControl = Dialog.useDialogControl()

  return (
    <RunesScreenLayout titleText={l`Badges`}>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={VerifiedIcon} />
        <SettingsList.ItemText>
          <Trans>Verification</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="custom_verifications"
          label={l`Select your own set of trusted verifiers, and operate as a verifier`}
          value={deerVerificationEnabled}
          onChange={value => setDeerVerificationEnabled(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>
              Select your own set of trusted verifiers, and operate as a
              verifier
            </Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
      </SettingsList.Group>

      <SettingsList.Item>
        <Admonition type="warning" style={[a.flex_1]}>
          <Trans>
            May slow down the client or fail to find all labels. Revoke and
            grant trust in the meatball menu on a profile.{' '}
            {deerVerificationEnabled
              ? 'You currently'
              : 'If enabled, you would'}{' '}
            trust the following verifiers:
          </Trans>
        </Admonition>
      </SettingsList.Item>

      <SettingsList.Item>
        <SettingsList.ItemIcon icon={VerifiedIcon} />
        <SettingsList.ItemText>
          <Trans>{`Trusted Verifiers`}</Trans>
        </SettingsList.ItemText>
        <SettingsList.BadgeButton
          label={l`View`}
          onPress={() => setTrustedVerifiersDialogControl.open()}
        />
      </SettingsList.Item>

      <SettingsList.Divider />

      <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>
          <Trans>PDS badges</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="pds_label_badge"
          label={l`Show a PDS badge next to the display name on profiles`}
          value={pdsLabelEnabled}
          onChange={value => setPdsLabelEnabled(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Show a PDS badge next to the display name on profiles</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        {pdsLabelEnabled && (
          <Toggle.Item
            name="pds_label_hide_bsky"
            label={l`Hide PDS badge for Bluesky-hosted accounts`}
            value={pdsLabelHideBskyPds}
            onChange={value => setPdsLabelHideBskyPds(value)}
            style={[a.w_full]}>
            <Toggle.LabelText style={[a.flex_1]}>
              <Trans>Hide PDS badge for Bluesky-hosted accounts</Trans>
            </Toggle.LabelText>
            <Toggle.Platform />
          </Toggle.Item>
        )}
      </SettingsList.Group>

      {pdsLabelEnabled && (
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={StarIcon} />
          <SettingsList.ItemText>
            <Trans>Favicon service</Trans>
          </SettingsList.ItemText>
          <SettingsList.BadgeButton
            label={l`Change`}
            onPress={() => setFaviconServiceControl.open()}
          />
        </SettingsList.Item>
      )}

      <FaviconServiceDialog control={setFaviconServiceControl} />
      <TrustedVerifiersDialog control={setTrustedVerifiersDialogControl} />
    </RunesScreenLayout>
  )
}

function FaviconServiceDialog({control}: {control: Dialog.DialogControlProps}) {
  const pal = usePalette('default')
  const {t: l} = useLingui()

  const faviconService = useFaviconService()
  const [url, setUrl] = useState(faviconService ?? '')
  const [inputVersion, setInputVersion] = useState(0)
  const setFaviconService = useSetFaviconService()

  const updateInputValue = (nextUrl: string) => {
    setUrl(nextUrl)
    setInputVersion(version => version + 1)
  }

  const presets = [
    'https://twenty-icons.com/(pds)',
    'https://favicon.im/(pds)?larger=true&throw-error-on-404=true',
    'https://favicon.blueat.net/(pds)?larger=true&throw-error-on-404=true',
  ]

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => updateInputValue(faviconService ?? '')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Favicon Service URL`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Favicon Service URL</Trans>
          </Text>
          <Text style={[a.text_sm, {color: pal.colors.textLight}]}>
            <Trans>
              (pds) is replaced with the domain of an account&apos;s host.
            </Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            key={`favicon-service-input-${inputVersion}`}
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={setUrl}
            placeholder={persisted.defaults.faviconService}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={() => {
              setFaviconService(url.trim())
              control.close()
            }}
            accessibilityHint={l`Enter the favicon service URL with (pds) as placeholder`}
            defaultValue={url}
          />

          <View style={[a.flex_row, a.flex_wrap, a.mb_xs]}>
            {presets.map(preset => (
              <Button
                key={preset}
                variant="ghost"
                color="primary"
                label={preset}
                style={[a.px_sm, a.py_xs, a.rounded_sm, a.gap_sm]}
                onPress={() => updateInputValue(preset)}>
                <ButtonText>{preset}</ButtonText>
              </Button>
            ))}
          </View>

          <View style={IS_WEB && [a.flex_row, a.justify_end]}>
            <Button
              label={l`Save`}
              size="large"
              onPress={() => {
                setFaviconService(url.trim())
                control.close()
              }}
              variant="solid"
              color="primary"
              disabled={url.length > 0 && !url.includes('(pds)')}>
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

function TrustedVerifiersDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Trusted Verifiers`}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Trusted Verifiers</Trans>
          </Text>
        </View>

        <TrustedVerifiers />

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function TrustedVerifiers() {
  const trusted = useDeerVerificationTrusted()
  const moderationOpts = useModerationOpts()
  const {gtMobile} = useBreakpoints()

  const results = useProfilesQuery({
    handles: Array.from(trusted),
  })

  if (!results.data || moderationOpts === undefined) {
    return null
  }

  return (
    <View style={[gtMobile ? a.pl_md : a.pl_sm, a.pb_sm]}>
      {results.data.profiles.map(profile => (
        <SearchProfileCard
          key={profile.did}
          profile={profile as ProfileViewBasic}
          moderationOpts={moderationOpts}
        />
      ))}
    </View>
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

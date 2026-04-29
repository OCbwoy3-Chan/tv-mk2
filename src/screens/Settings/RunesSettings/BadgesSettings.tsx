import {useCallback, useMemo, useState} from 'react'
import {LayoutAnimation, View} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {type ModerationOpts} from '@atproto/api'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import * as persisted from '#/state/persisted'
import {
  useDeerVerification,
  useDeerVerificationEnabled,
  useDeerVerificationTrustAppView,
  useDeerVerificationTrusted,
  useSetDeerVerification,
  useSetDeerVerificationEnabled,
  useSetDeerVerificationTrust,
} from '#/state/preferences/deer-verification'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
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
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  type ProfileItem,
  SearchablePeopleList,
} from '#/components/dialogs/SearchablePeopleList'
import * as Toggle from '#/components/forms/Toggle'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '#/components/icons/Chevron'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Star_Stroke2_Corner0_Rounded as StarIcon} from '#/components/icons/Star'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as ProfileCard from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'
import {RunesScreenLayout} from './components/RunesScreenLayout'

export function RunesBadgesSettingsScreen() {
  const {t: l} = useLingui()

  const deerVerification = useDeerVerification()
  const deerVerificationEnabled = useDeerVerificationEnabled()
  const trustAppView = useDeerVerificationTrustAppView()
  const setDeerVerification = useSetDeerVerification()
  const setDeerVerificationEnabled = useSetDeerVerificationEnabled()

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
          <Trans>Trusted verifiers</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          name="custom_verifications"
          label={l`Use own selection of trusted verifiers`}
          value={deerVerificationEnabled}
          onChange={value => setDeerVerificationEnabled(value)}
          style={[a.w_full]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>Use own selection of trusted verifiers</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        {deerVerificationEnabled && (
          <Toggle.Item
            name="trust_verifiers_from_appview"
            label={l`Trust verifiers from current AppView`}
            value={trustAppView}
            onChange={value =>
              setDeerVerification({...deerVerification, trustAppView: value})
            }
            style={[a.w_full]}>
            <Toggle.LabelText style={[a.flex_1]}>
              <Trans>Trust verifiers from current AppView</Trans>
            </Toggle.LabelText>
            <Toggle.Platform />
          </Toggle.Item>
        )}
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
      <TrustedVerifiersSection />

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

function TrustedVerifiersSection() {
  const {t: l} = useLingui()
  const reducedMotion = useReducedMotion()
  const addTrustedVerifierDialogControl = Dialog.useDialogControl()
  const resetTrustedVerifiersPromptControl = Prompt.usePromptControl()
  const deerVerification = useDeerVerification()
  const setDeerVerification = useSetDeerVerification()
  const currentAccountProfile = useCurrentAccountProfile()
  const {currentAccount} = useSession()
  const currentAccountDid = currentAccount?.did
  const [isExpanded, setIsExpanded] = useState(false)
  const trusted = useDeerVerificationTrusted()

  const results = useProfilesQuery({
    handles: Array.from(trusted).filter(
      did => did !== currentAccountProfile?.did,
    ),
    maintainData: true,
  })

  const trustedProfiles = useMemo(() => {
    const profiles: bsky.profile.AnyProfileView[] = []
    const seen = new Set<string>()

    if (currentAccountProfile && trusted.has(currentAccountProfile.did)) {
      profiles.push(currentAccountProfile)
      seen.add(currentAccountProfile.did)
    }

    for (const profile of results.data?.profiles ?? []) {
      if (!trusted.has(profile.did)) continue
      if (seen.has(profile.did)) continue
      profiles.push(profile)
      seen.add(profile.did)
    }

    return profiles
  }, [currentAccountProfile, results.data?.profiles, trusted])

  const onToggleExpanded = useCallback(() => {
    if (!reducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }
    setIsExpanded(current => !current)
  }, [reducedMotion])

  const onResetAll = useCallback(() => {
    setDeerVerification({
      ...deerVerification,
      trustedSelf: true,
      trusted: [],
    })
  }, [deerVerification, setDeerVerification])

  return (
    <>
      <SettingsList.PressableItem
        label={l`Trusted verifiers`}
        accessibilityHint={l`Shows the trusted verifiers you act as`}
        onPress={onToggleExpanded}>
        <SettingsList.ItemIcon icon={VerifiedIcon} />
        <SettingsList.ItemText>
          <Trans>{`Trusted verifiers`}</Trans>
        </SettingsList.ItemText>
        {!isExpanded && (
          <SettingsList.BadgeText>
            <Plural value={trusted.size} one="# selected" other="# selected" />
          </SettingsList.BadgeText>
        )}
        <SettingsList.ItemIcon
          icon={isExpanded ? ChevronTopIcon : ChevronBottomIcon}
          size="md"
        />
      </SettingsList.PressableItem>

      {isExpanded && (
        <View style={[a.pb_sm]}>
          {trustedProfiles.length > 0 ? (
            trustedProfiles.map(profile => (
              <TrustedVerifierRow
                key={profile.did}
                profile={profile}
                isCurrentAccount={profile.did === currentAccountProfile?.did}
              />
            ))
          ) : (
            <SettingsList.Item iconInset>
              <Text style={[a.text_sm, a.text_center, a.flex_1]}>
                <Trans>No trusted verifiers selected.</Trans>
              </Text>
            </SettingsList.Item>
          )}

          <View style={[a.px_xl, a.pt_sm, a.gap_sm, a.flex_row]}>
            <Button
              label={l`Reset all trusted verifiers`}
              size="small"
              color="negative_subtle"
              style={[a.flex_1]}
              disabled={!currentAccountDid}
              onPress={() => resetTrustedVerifiersPromptControl.open()}>
              <ButtonText>
                <Trans>Reset all</Trans>
              </ButtonText>
            </Button>
            <Button
              label={l`Add trusted verifiers`}
              size="small"
              color="secondary"
              style={[a.flex_1]}
              onPress={() => addTrustedVerifierDialogControl.open()}>
              <ButtonIcon icon={PlusIcon} />
              <ButtonText>
                <Trans>Add trusted verifiers</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      )}

      <TrustedVerifiersAddDialog control={addTrustedVerifierDialogControl} />
      <Prompt.Basic
        control={resetTrustedVerifiersPromptControl}
        title={l`Are you sure?`}
        description={l`This will clear your selected trusted verifiers, resulting in only your account being active.`}
        confirmButtonCta={l`Reset all`}
        confirmButtonColor="negative"
        onConfirm={onResetAll}
      />
    </>
  )
}

function TrustedVerifierRow({
  profile,
  isCurrentAccount,
}: {
  profile: bsky.profile.AnyProfileView
  isCurrentAccount: boolean
}) {
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const enableSquareButtons = useEnableSquareButtons()
  const setDeerVerificationTrust = useSetDeerVerificationTrust()
  const t = useTheme()

  const onRemove = useCallback(() => {
    setDeerVerificationTrust.remove(profile.did)
    Toast.show(l`Removed trusted verifier`)
  }, [l, profile.did, setDeerVerificationTrust])

  if (!moderationOpts) return null

  return (
    <View style={[a.px_xl, a.py_sm]}>
      <ProfileCard.Header>
        <ProfileCard.Link profile={profile} style={[a.flex_1]}>
          <View style={[a.flex_1, a.w_full]}>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                profile={profile}
                moderationOpts={moderationOpts}
                disabledPreview
              />
              <View style={[a.flex_1]}>
                <ProfileCard.NameAndHandle
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                {isCurrentAccount && (
                  <Text
                    style={[a.text_xs, t.atoms.text_contrast_low, a.pt_2xs]}>
                    <Trans>Current account</Trans>
                  </Text>
                )}
              </View>
            </ProfileCard.Header>
          </View>
        </ProfileCard.Link>
        <Button
          label={
            isCurrentAccount
              ? l`Remove current account from trusted verifiers`
              : l`Remove trusted verifier`
          }
          color="secondary"
          variant="ghost"
          size="small"
          shape={enableSquareButtons ? 'square' : 'round'}
          onPress={onRemove}>
          <ButtonIcon icon={XIcon} size="md" />
        </Button>
      </ProfileCard.Header>
    </View>
  )
}

function TrustedVerifiersAddDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{fullHeight: true}}>
      <Dialog.Handle />
      <TrustedVerifiersAddDialogInner />
    </Dialog.Outer>
  )
}

function TrustedVerifiersAddDialogInner() {
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const trusted = useDeerVerificationTrusted()
  const setDeerVerificationTrust = useSetDeerVerificationTrust()
  const {currentAccount} = useSession()

  const renderProfileCard = useCallback(
    (item: ProfileItem) => {
      if (!moderationOpts) return null

      return (
        <TrustedVerifierSearchResult
          profile={item.profile}
          moderationOpts={moderationOpts}
          isTrusted={trusted.has(item.profile.did)}
          isCurrentAccount={item.profile.did === currentAccount?.did}
          onToggle={() => {
            if (trusted.has(item.profile.did)) {
              setDeerVerificationTrust.remove(item.profile.did)
              Toast.show(l`Removed trusted verifier`)
            } else {
              setDeerVerificationTrust.add(item.profile.did)
              Toast.show(l`Added trusted verifier`)
            }
          }}
        />
      )
    },
    [currentAccount?.did, l, moderationOpts, setDeerVerificationTrust, trusted],
  )

  return (
    <SearchablePeopleList
      title={l`Add trusted verifiers`}
      renderProfileCard={renderProfileCard}
      excludeSelf={false}
    />
  )
}

function TrustedVerifierSearchResult({
  profile,
  moderationOpts,
  isTrusted,
  isCurrentAccount,
  onToggle,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  isTrusted: boolean
  isCurrentAccount: boolean
  onToggle: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.py_sm, a.px_lg]}>
      <ProfileCard.Header>
        <ProfileCard.Link profile={profile} style={[a.flex_1]}>
          <View style={[a.flex_1, a.w_full]}>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                profile={profile}
                moderationOpts={moderationOpts}
                disabledPreview
              />
              <View style={[a.flex_1]}>
                <ProfileCard.NameAndHandle
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                {isCurrentAccount && (
                  <Text
                    style={[a.text_xs, t.atoms.text_contrast_low, a.pt_2xs]}>
                    <Trans>Current account</Trans>
                  </Text>
                )}
              </View>
            </ProfileCard.Header>
          </View>
        </ProfileCard.Link>
        <Button
          label={
            isTrusted ? l`Remove trusted verifier` : l`Add trusted verifier`
          }
          onPress={onToggle}
          size="small"
          variant="solid"
          color="secondary">
          <ButtonText>
            {isTrusted ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
          </ButtonText>
        </Button>
      </ProfileCard.Header>
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

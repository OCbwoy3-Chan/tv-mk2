import { useState } from 'react'
import { View } from 'react-native'
import { type Service } from '@atproto/lex'
import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { PUBLIC_APPVIEW_DID } from '#/lib/constants'
import { createLexClient } from '#/lib/lexClient'
import { getShapeRadius } from '#/lib/shapes'
import { cleanError } from '#/lib/strings/errors'
import { updateProfileShadow } from '#/state/cache/profile-shadow'
import {
  APPVIEW_PRESETS,
  type AppViewPresetId,
  didWebFromAppViewUrl,
  getActiveAppViewTitle,
  normalizeAppViewUrl,
  readAppViewProxy,
  useCustomAppViewDid,
  useCustomAppViewUrl,
} from '#/state/preferences/custom-appview-did'
import { useEnableSquareButtons } from '#/state/preferences/enable-square-buttons'
import { findService, useDidDocument } from '#/state/queries/resolve-identity'
import { useAppviewClient, usePdsClient } from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import { atoms as a, useTheme, web } from '#/alf'
import { Admonition } from '#/components/Admonition'
import { Button, ButtonText } from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import { BellRinging_Stroke2_Corner0_Rounded as BellIcon } from '#/components/icons/BellRinging'
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe'
import { Loader } from '#/components/Loader'
import { Text } from '#/components/Typography'
import { importNotificationSettings } from '#/deltas/import-notification-settings'

export function ImportNotificationSettings() {
  const { t: l } = useLingui()
  const control = Dialog.useDialogControl()
  return (
    <>
      <SettingsList.PressableItem
        label={l`Import notification settings`}
        testID="openNotificationImport"
        onPress={control.open}>
        <SettingsList.ItemIcon icon={BellIcon} />
        <SettingsList.ItemText>
          <Trans>Import notification settings</Trans>
        </SettingsList.ItemText>
        <SettingsList.Chevron />
      </SettingsList.PressableItem>
      <Dialog.Outer control={control} nativeOptions={{ preventExpansion: true }}>
        <Dialog.Handle />
        <ImportDialogInner control={control} />
      </Dialog.Outer>
    </>
  )
}

function ImportDialogInner({ control }: { control: Dialog.DialogControlProps }) {
  const { t: l } = useLingui()
  const t = useTheme()
  const squareButtons = useEnableSquareButtons()
  const [preset, setPreset] = useState<AppViewPresetId>('bluesky')
  const [customUrl, setCustomUrl] = useState('')
  const [activeDid] = useCustomAppViewDid()
  const [activeUrl] = useCustomAppViewUrl()
  const destinationTitle = getActiveAppViewTitle(activeDid, activeUrl)
  const destination = useAppviewClient()
  const pds = usePdsClient()
  const queryClient = useQueryClient()
  const normalizedUrl = normalizeAppViewUrl(customUrl)
  const customDid =
    preset === 'custom' ? didWebFromAppViewUrl(normalizedUrl) : undefined
  const doc = useDidDocument({ did: customDid ?? '' })
  const service =
    doc.data && findService(doc.data, '#bsky_appview', 'BskyAppView')
  const did =
    preset === 'bluesky'
      ? PUBLIC_APPVIEW_DID
      : preset === 'blacksky'
        ? APPVIEW_PRESETS.blacksky.did
        : customDid
  const sameServer = !!did && `${did}#bsky_appview` === readAppViewProxy()
  const isValid =
    !!did && !sameServer && (preset !== 'custom' || !!service?.serviceEndpoint)
  const { mutate, reset, isPending, isSuccess, error } = useMutation({
    async mutationFn() {
      if (!isValid) throw new Error('Invalid source AppView')
      const source = createLexClient(pds.agent, {
        service: `${did}#bsky_appview` as Service,
      })
      const updates = await importNotificationSettings(source, destination)
      for (const update of updates) {
        updateProfileShadow(queryClient, update.subject, {
          activitySubscription: update.activitySubscription,
        })
      }
    },
    async onSettled() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activity-subscriptions'] }),
        queryClient.invalidateQueries({
          queryKey: ['notification-settings', 'app'],
        }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ])
    },
  })

  return (
    <Dialog.ScrollableInner
      accessibilityLabelledBy="notification-import-title"
      accessibilityDescribedBy="notification-import-description"
      style={web({
        maxWidth: 400,
        borderRadius: getShapeRadius(squareButtons, 18, 36),
      })}>
      <View style={[a.w_full, a.gap_md]}>
        <View style={[a.gap_sm]}>
          <Text
            nativeID="notification-import-title"
            style={[a.text_2xl, a.font_bold, a.pr_5xl]}>
            <Trans>Import notification settings</Trans>
          </Text>
          <Text
            nativeID="notification-import-description"
            style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Import your notification settings from...
            </Trans>
          </Text>
        </View>
        <SegmentedControl.Root
          type="tabs"
          label={l`Import from`}
          value={preset}
          onChange={value => {
            if (isPending) return
            reset()
            setPreset(value)
          }}>
          <SegmentedControl.Item
            value="bluesky"
            label={l`Bluesky`}
            disabled={isPending}
            testID="notificationImportBluesky">
            <SegmentedControl.ItemText>{l`Bluesky`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item
            value="blacksky"
            label={l`Blacksky`}
            disabled={isPending}
            testID="notificationImportBlacksky">
            <SegmentedControl.ItemText>{l`Blacksky`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item
            value="custom"
            label={l`Custom`}
            disabled={isPending}
            testID="notificationImportCustom">
            <SegmentedControl.ItemText>{l`Custom`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
        {preset === 'custom' && (
          <View style={[a.gap_sm]} role="tabpanel">
            <TextField.Root>
              <TextField.Icon icon={GlobeIcon} />
              <Dialog.Input
                label={l`Source AppView URL`}
                accessibilityLabelledBy="notification-import-url-label"
                testID="notificationImportSource"
                value={customUrl}
                placeholder="https://api.example.com"
                onChangeText={value => {
                  reset()
                  setCustomUrl(value)
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!isPending}
              />
            </TextField.Root>
            {!!normalizedUrl && doc.isLoading && (
              <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                <Loader size="sm" />
                <Text style={[t.atoms.text_contrast_medium]}>
                  <Trans>Loading...</Trans>
                </Text>
              </View>
            )}
            {!!normalizedUrl && !doc.isLoading && !service?.serviceEndpoint && (
              <Admonition type="error">
                <Trans>
                  Couldn't find an AppView at this URL. Check the address and
                  try again.
                </Trans>
              </Admonition>
            )}
          </View>
        )}
        {sameServer && (
          <Admonition type="info">
            <Trans>Choose a different app server to import from.</Trans>
          </Admonition>
        )}
        {error && (
          <Admonition type="error">
            <Trans>
              Import failed. Some settings may already have been copied. You can
              retry safely.
            </Trans>{' '}
            {cleanError(error)}
          </Admonition>
        )}
        {isSuccess ? (
          <>
            <Text accessibilityLiveRegion="polite">
              <Trans>
                Success!
              </Trans>
            </Text>
            <Button
              label={l`Done`}
              size="large"
              color="primary"
              onPress={() => control.close()}>
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </>
        ) : (
          <Button
            label={l`Import settings`}
            testID="importNotificationSettings"
            size="large"
            color="primary"
            disabled={!isValid || isPending}
            onPress={() => mutate()}>
            {isPending && <Loader size="sm" />}
            <ButtonText>
              {isPending ? l`Importing...` : l`Import settings`}
            </ButtonText>
          </Button>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

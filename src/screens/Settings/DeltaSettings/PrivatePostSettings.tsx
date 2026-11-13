import { useState } from 'react'
import { View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'

import { forcePrivatePostsResync } from '#/lib/api/private-posts'
import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {
  usePrivatePostsAppViewDID,
  usePrivatePostsAppViewURL,
} from '#/state/preferences/private-posts-appview'
import { usePrivatePostsEnabled } from '#/state/preferences/private-posts-enabled'
import {
  usePrivatePostsModStatus,
  usePrivatePostsState,
} from '#/state/queries/private-posts'
import { useSpacesCompatiblePDS } from '#/state/queries/spaces'
import { useAgent, useSession } from '#/state/session'
import { atoms as a, useTheme } from '#/alf'
import {
  Admonition,
  Content as AdmonitionContent,
  Icon as AdmonitionIcon,
  Outer as AdmonitionOuter,
  Row as AdmonitionRow,
  Text as AdmonitionText,
} from '#/components/Admonition'
import { Button, ButtonText } from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import { createStaticClick, InlineLinkText } from '#/components/Link'
import * as Toast from '#/components/Toast'
import { Text } from '#/components/Typography'
import { device, useStorage } from '#/storage'
import { DeltasPrivatePostsToggle } from './components/PrivatePostsToggle'

export function DeltaPrivatePostSettingsScreen() {
  const t = useTheme()
  const privatePostsEnabled = usePrivatePostsEnabled()
  const isSpacesCompatiblePDS = useSpacesCompatiblePDS(
    privatePostsEnabled === true,
  )
  const { status: privatePostModFetchState, data: privatePostModState } =
    usePrivatePostsModStatus()
  const { status: privatePostStateFetchState, data: privatePostState } =
    usePrivatePostsState()
  const navigation = useNavigationDeduped()
  const { t: l } = useLingui()
  const agent = useAgent()
  const { currentAccount } = useSession()
  const [appViewDID] = usePrivatePostsAppViewDID()
  const appViewURL = usePrivatePostsAppViewURL()
  const [isResyncing, setIsResyncing] = useState(false)
  const [fallbackEnabled, setFallbackEnabled] = useStorage(device, [
    'privatePostsFallbackEnabled',
  ])

  const onResync = async () => {
    const pdsUrl = currentAccount?.pdsUrl ?? currentAccount?.service
    if (!appViewURL || !pdsUrl || isResyncing) return
    setIsResyncing(true)
    try {
      await forcePrivatePostsResync({ agent, pdsUrl, appViewURL, appViewDID })
      Toast.show(l`Private posts synced`, { type: 'success' })
    } catch (error) {
      console.log('privatepost sync err:', error)
      Toast.show(
        error instanceof Error ? error.message : l`Private posts sync failed`,
        { type: 'error' },
      )
    } finally {
      setIsResyncing(false)
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Private posts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_xl, a.gap_xl]}>
          <View style={[a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Private posts</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                Share private posts with your mutuals. This experimental feature
                uses AT Protocol spaces or an optional encrypted fallback.
              </Trans>
            </Text>
          </View>
          <Admonition type="info">
            <Trans>
              Bluesky may choose to suspend or ban your account if the majority
              of your posts are private, as it may trip their spam filters.
            </Trans>
          </Admonition>
          <DeltasPrivatePostsToggle />
          {privatePostsEnabled && isSpacesCompatiblePDS === false && (
            <View style={[a.gap_sm]}>
              <Toggle.Item
                name="private-posts-fallback"
                label={l`Enable private posts fallback`}
                value={fallbackEnabled ?? false}
                onChange={setFallbackEnabled}
                style={[a.w_full, a.rounded_md, t.atoms.bg_contrast_25]}>
                <SettingsList.Item>
                  <SettingsList.ItemText>
                    <Trans>Enable private posts fallback</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>
                  Fallback posts are encrypted in your public repository. Your
                  private posts server can read their contents. This is not
                  end-to-end encryption.
                </Trans>
              </Text>
            </View>
          )}
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_sm,
              a.leading_snug,
              { marginTop: -8 },
            ]}>
            <Trans>See also:</Trans>{' '}
            <InlineLinkText
              label={l`Infrastructure settings`}
              {...createStaticClick(() =>
                navigation.navigate('RunesInfrastructureSettings'),
              )}>
              <Trans>Infrastructure settings</Trans>
            </InlineLinkText>
          </Text>
          {(privatePostsEnabled && isSpacesCompatiblePDS === false && !fallbackEnabled) && (
            <Admonition type="error">
              {privatePostsEnabled && !isSpacesCompatiblePDS && (
                <Trans>Your PDS does not support atproto spaces.</Trans>
              )}
            </Admonition>
          )}
          {privatePostModFetchState === 'success' &&
            privatePostModState?.isBanned === true && (
              <AdmonitionOuter type="error">
                <AdmonitionRow>
                  <AdmonitionIcon />
                  <AdmonitionContent>
                    <AdmonitionText>
                      <Trans>
                        You are banned from publishing private posts to your
                        current Private Vessel instance.
                      </Trans>
                    </AdmonitionText>
                    {privatePostModState.reason && (
                      <View style={[a.gap_xs]}>
                        <Text style={[a.text_sm, a.font_bold]}>
                          <Trans>Ban reason</Trans>
                        </Text>
                        <Text style={[a.text_sm, a.leading_snug]}>
                          {privatePostModState.reason}
                        </Text>
                      </View>
                    )}
                    {privatePostModState.offendingContent?.length ? (
                      <View style={[a.gap_sm]}>
                        <Text style={[a.text_sm, a.font_bold]}>
                          <Trans>Offending content</Trans>
                        </Text>
                        {privatePostModState.offendingContent.map(
                          (content, index) => (
                            <View
                              key={`${content.name}-${index}`}
                              style={[
                                a.gap_xs,
                                a.p_sm,
                                a.rounded_sm,
                                t.atoms.bg_contrast_25,
                              ]}>
                              <Text
                                style={[
                                  a.text_sm,
                                  a.leading_snug,
                                  t.atoms.text_contrast_medium,
                                ]}>
                                <Trans>Reason: {content.reason}</Trans>
                              </Text>
                              <Text style={[a.text_sm, a.font_bold]}>
                                {content.name}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    ) : null}
                  </AdmonitionContent>
                </AdmonitionRow>
              </AdmonitionOuter>
            )}
          {privatePostsEnabled &&
            isSpacesCompatiblePDS === true && (
              <View style={[a.gap_sm]}>
                <Text style={[a.text_md, a.leading_snug]}>
                  <Trans>
                    If your private posts haven’t appeared, try syncing them
                    with your private posts server.
                  </Trans>
                </Text>
                <Button
                  color="secondary"
                  size="small"
                  label={l`Resynchronize private post records`}
                  onPress={() => void onResync()}
                  disabled={isResyncing || !appViewURL}>
                  <ButtonText>
                    {isResyncing ? l`Syncing…` : l`Sync records`}
                  </ButtonText>
                </Button>
              </View>
            )}
          {privatePostStateFetchState === 'success' && privatePostState && (
            <View style={[a.gap_sm]}>
              <Text style={[a.text_md, a.font_bold]}>PrivateVessel debug</Text>
              <View style={[a.p_md, a.rounded_sm, t.atoms.bg_contrast_25]}>
                <Text style={[a.text_sm, a.leading_snug]}>
                  {JSON.stringify(privatePostState, null, 2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

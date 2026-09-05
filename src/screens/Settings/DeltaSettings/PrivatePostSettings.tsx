import { useState } from 'react'
import { View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'

import { forcePrivatePostsResync } from '#/lib/api/private-posts'
import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped'
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
import * as Layout from '#/components/Layout'
import { createStaticClick, InlineLinkText } from '#/components/Link'
import * as Toast from '#/components/Toast'
import { Text } from '#/components/Typography'
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

  const onResync = async () => {
    if (!appViewURL || isResyncing) return
    setIsResyncing(true)
    try {
      await forcePrivatePostsResync({ agent, appViewURL, appViewDID })
      Toast.show(l`Private posts synced`, { type: 'success' })
    } catch (error) {
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
              Post only to your mutuals or lists with ATProto spaces! Third
              parties will be unable to read any post you choose to make
              private. This is *veeery* experimental and will only work if your
              PDS is running the spaces alpha.
            </Text>
          </View>
          <Admonition type="info">
            <Trans>
              Bluesky may choose to suspend or ban your account if the majority
              of your posts are private, as it may trip their spam filters.
            </Trans>{' '}
            <Trans>
              This isn't actually confirmed, might need to ask someone at
              Bluesky about this, it's better to be safe than sorry.
            </Trans>
          </Admonition>
          <DeltasPrivatePostsToggle />
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
          {privatePostsEnabled && (
            <Admonition type="warning">
              <Trans>Do not post anything that violates Bluesky's TOS.</Trans>{' '}
              <Trans>
                Embeds in private posts will NOT be supported because people
                will use them post GTA 6 leaks.
              </Trans>
            </Admonition>
          )}
          {currentAccount?.isOauthSession === true && (
            <Admonition type="error">
              <Trans>
                OAuth sessions are not currently supported for private posts.
                Please log in with a password to use this feature.
              </Trans>
            </Admonition>
          )}
          {privatePostsEnabled && !isSpacesCompatiblePDS && (
            <Admonition type="error">
              <Trans>
                You are unable to make private posts, as your PDS does not
                support ATProto Spaces. You can still read them.
              </Trans>
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
                                Reason: {content.reason}
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
            isSpacesCompatiblePDS === true &&
            currentAccount?.isOauthSession !== true && (
              <View style={[a.gap_sm]}>
                <Text style={[a.text_md, a.leading_snug]}>
                  <Trans>
                    Since tenna.party and the private post infrastructure is
                    brand new and extremely unstable, some of your posts may
                    fail to sync to our AppView. Tap the button below to sync
                    them.
                  </Trans>
                </Text>
                <Button
                  color="secondary"
                  size="small"
                  label={l`Resynchronize private post records`}
                  onPress={() => void onResync()}
                  disabled={isResyncing || !appViewURL}>
                  <ButtonText>
                    {isResyncing ? l`Syncing...` : l`Sync records`}
                  </ButtonText>
                </Button>
              </View>
            )}
          {privatePostStateFetchState === 'success' && privatePostState && (
            <View style={[a.gap_sm]}>
              <Text style={[a.text_md, a.font_bold]}>
                PrivateVessel debug
              </Text>
              <View style={[a.p_md, a.rounded_sm, t.atoms.bg_contrast_25]}>
                <Text
                  style={[
                    a.text_sm,
                    a.leading_snug
                  ]}>
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

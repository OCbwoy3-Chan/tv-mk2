import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {usePrivatePostsEnabled} from '#/state/preferences/private-posts-enabled'
import {useSpacesCompatiblePDS} from '#/state/queries/spaces'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {DeltasPrivatePostsToggle} from './components/PrivatePostsToggle'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {usePrivatePostsModStatus} from '#/state/queries/private-posts'
import {
  usePrivatePostsAppViewDID,
  usePrivatePostsAppViewURL,
} from '#/state/preferences/private-posts-appview'
import {useAgent, useSession} from '#/state/session'
import {forcePrivatePostsResync} from '#/lib/api/private-posts'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '#/components/Toast'

export function DeltaPrivatePostSettingsScreen() {
  const t = useTheme()
  const privatePostsEnabled = usePrivatePostsEnabled()
  const isSpacesCompatiblePDS = useSpacesCompatiblePDS(
    privatePostsEnabled === true,
  )
  const {status: privatePostModFetchState, data: privatePostModState} =
    usePrivatePostsModStatus()
  const navigation = useNavigationDeduped()
  const {t: l} = useLingui()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const [appViewDID] = usePrivatePostsAppViewDID()
  const appViewURL = usePrivatePostsAppViewURL()
  const [isResyncing, setIsResyncing] = useState(false)

  const onResync = async () => {
    if (!appViewURL || isResyncing) return
    setIsResyncing(true)
    try {
      await forcePrivatePostsResync({agent, appViewURL, appViewDID})
      Toast.show(l`Private posts synced`, {type: 'success'})
    } catch (error) {
      Toast.show(
        error instanceof Error ? error.message : l`Private posts sync failed`,
        {type: 'error'},
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
              {marginTop: -8},
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
                OAuth sessions are not currently supported for private posts. Please log in with a password to use this feature.
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
              <Admonition type="error">
                <Trans>
                  You are banned from making private posts on tenna.party.
                </Trans>
                {privatePostModState?.reason && (
                  <Trans> Reason: {privatePostModState?.reason}</Trans>
                )}
              </Admonition>
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
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

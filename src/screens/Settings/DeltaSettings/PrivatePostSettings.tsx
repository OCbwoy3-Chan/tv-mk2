import { View } from 'react-native'
import { Trans } from '@lingui/react/macro'

import { usePrivatePostsEnabled } from '#/state/preferences/private-posts-enabled'
import { useSpacesCompatiblePDS } from '#/state/queries/spaces'
import { atoms as a, useTheme } from '#/alf'
import { Admonition } from '#/components/Admonition'
import * as Layout from '#/components/Layout'
import { Text } from '#/components/Typography'
import { DeltasPrivatePostsToggle } from './components/PrivatePostsToggle'

export function DeltaPrivatePostSettingsScreen() {
  const t = useTheme()
  const privatePostsEnabled = usePrivatePostsEnabled()
  const isSpacesCompatiblePDS = useSpacesCompatiblePDS(privatePostsEnabled === true)

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
              <Trans>
                Private posts
              </Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              Post only to your mutuals or lists with ATProto spaces!
              Third parties will be unable to read any post you choose to make private.
              This is *veeery* experimental and will only work if your PDS is running the spaces alpha.
            </Text>
          </View>
          <Admonition type="info">
            <Trans>
              Bluesky may choose to suspend or ban your account if the majority of your posts are private, as it may trip their spam filters.
            </Trans>
            {" "}
            <Trans>
              This isn't actually confirmed, might need to ask someone at Bluesky about this, it's better to be safe than sorry.
            </Trans>
          </Admonition>
          <DeltasPrivatePostsToggle />
          {
            privatePostsEnabled && <Admonition type="warning">
              <Trans>
                Do not post anything that violates Bluesky's TOS.
              </Trans>
              {" "}
              <Trans>
                Embeds in private posts will NOT be supported because people will use them post GTA 6 leaks.
              </Trans>
            </Admonition>
          }
          {
            (privatePostsEnabled && !isSpacesCompatiblePDS) && <Admonition type="error">
              <Trans>
                You are unable to make private posts, as your PDS does not support ATProto Spaces. You can still read them.
              </Trans>
            </Admonition>
          }
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

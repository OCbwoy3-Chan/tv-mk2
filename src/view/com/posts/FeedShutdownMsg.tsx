import {useCallback} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {logger} from '#/logger'
import {
  usePreferencesQuery,
  useRemoveFeedMutation,
  useReplaceForYouWithDiscoverFeedMutation,
} from '#/state/queries/preferences'
import {useSetSelectedFeed} from '#/state/shell/selected-feed'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function FeedShutdownMsg({feedUri}: {feedUri: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const setSelectedFeed = useSetSelectedFeed()
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: removeFeed, isPending: isRemovePending} =
    useRemoveFeedMutation()
  const {mutateAsync: replaceFeedWithTennalings, isPending: isReplacePending} =
    useReplaceForYouWithDiscoverFeedMutation()

  const feedConfig = preferences?.savedFeeds?.find(
    f => f.value === feedUri && f.pinned,
  )
  const discoverFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === DISCOVER_FEED_URI,
  )
  const hasFeedPinned = Boolean(feedConfig)
  const hasTennalingsPinned = Boolean(discoverFeedConfig?.pinned)

  const onRemoveFeed = useCallback(async () => {
    try {
      if (feedConfig) {
        await removeFeed(feedConfig)
        Toast.show(_(msg`Removed from your feeds`))
      }
      if (hasTennalingsPinned) {
        setSelectedFeed(`feedgen|${DISCOVER_FEED_URI}`)
      }
    } catch (err: any) {
      Toast.show(
        _(
          msg`There was an issue updating your feeds, please check your internet connection and try again.`,
        ),
        {
          type: 'warning',
        },
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }, [removeFeed, feedConfig, _, hasTennalingsPinned, setSelectedFeed])

  const onReplaceFeed = useCallback(async () => {
    try {
      await replaceFeedWithTennalings({
        forYouFeedConfig: feedConfig,
        discoverFeedConfig,
      })
      setSelectedFeed(`feedgen|${DISCOVER_FEED_URI}`)
      Toast.show(_(msg`The feed has been replaced with Tennalings.`))
    } catch (err: any) {
      Toast.show(
        _(
          msg`There was an issue updating your feeds, please check your internet connection and try again.`,
        ),
        {
          type: 'warning',
        },
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }, [
    replaceFeedWithTennalings,
    discoverFeedConfig,
    feedConfig,
    setSelectedFeed,
    _,
  ])

  const isProcessing = isReplacePending || isRemovePending
  return (
    <View
      style={[
        a.py_3xl,
        a.px_2xl,
        a.gap_xl,
        t.atoms.border_contrast_low,
        a.border_t,
      ]}>
      <Text style={[a.text_5xl, a.font_semi_bold, t.atoms.text, a.text_center]}>
        :(
      </Text>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text, a.text_center]}>
        <Trans>
          This feed is no longer online. We are showing{' '}
          <InlineLinkText
            label={_(msg`The Tennalings feed`)}
            to="/profile/did:web:vessel.darkworld.download/feed/tennalings"
            style={[a.text_md]}>
            Tennalings
          </InlineLinkText>{' '}
          instead.
        </Trans>
      </Text>
      {hasFeedPinned ? (
        <View style={[a.flex_row, a.justify_center, a.gap_sm]}>
          <Button
            variant="outline"
            color="primary"
            size="small"
            label={_(msg`Remove feed`)}
            disabled={isProcessing}
            onPress={onRemoveFeed}>
            <ButtonText>
              <Trans>Remove feed</Trans>
            </ButtonText>
            {isRemovePending && <ButtonIcon icon={Loader} />}
          </Button>
          {!hasTennalingsPinned && (
            <Button
              variant="solid"
              color="primary"
              size="small"
              label={_(msg`Replace with Tennalings`)}
              disabled={isProcessing}
              onPress={onReplaceFeed}>
              <ButtonText>
                <Trans>Replace with Tennalings</Trans>
              </ButtonText>
              {isReplacePending && <ButtonIcon icon={Loader} />}
            </Button>
          )}
        </View>
      ) : undefined}
    </View>
  )
}

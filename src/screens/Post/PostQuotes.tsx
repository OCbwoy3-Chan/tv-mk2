import {useCallback, useState} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Plural, Trans} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostQuery} from '#/state/queries/post'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import {Button, ButtonIcon} from '#/components/Button'
import {
  ChevronBottomTop_Stroke2_Corner0_Rounded as ChevronIn,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronOut,
} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>
export const PostQuotesScreen = ({route}: Props) => {
  const {_} = useLingui()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostQuery(uri)

  const {data: resolvedDid} = useResolveDidQuery(name)
  const {data: profile} = useProfileQuery({did: resolvedDid})
  const [isQuotedPostExtracted, setIsQuotedPostExtracted] = useState(false)

  const onToggleQuotedPost = useCallback(() => {
    setIsQuotedPostExtracted(value => !value)
  }, [])

  useSetTitle(profile ? _(msg`Post by @${profile.handle}`) : undefined)

  let quoteCount
  if (post) {
    quoteCount = post.quoteCount
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {post && (
            <>
              <Layout.Header.TitleText>
                <Trans>Quotes</Trans>
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                <Plural
                  value={quoteCount ?? 0}
                  one="# quote"
                  other="# quotes"
                />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot>
          {post && (
            <Button
              label={
                isQuotedPostExtracted
                  ? _(msg`Show quoted post in each quote`)
                  : _(msg`Extract quoted post`)
              }
              size="small"
              variant="ghost"
              color={isQuotedPostExtracted ? 'primary' : 'secondary'}
              shape="round"
              hitSlop={HITSLOP_10}
              onPress={onToggleQuotedPost}>
              <ButtonIcon
                icon={isQuotedPostExtracted ? ChevronOut : ChevronIn}
                size="md"
              />
            </Button>
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      <PostQuotesComponent
        uri={uri}
        quotedPost={post}
        isQuotedPostExtracted={isQuotedPostExtracted}
      />
    </Layout.Screen>
  )
}

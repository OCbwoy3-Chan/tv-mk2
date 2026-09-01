import {useEffect, useMemo, useState} from 'react'
import {type StyleProp, type TextStyle, View} from 'react-native'
import {RichText as RichTextApi} from '@atproto/api'

import {MAX_POST_LINES} from '#/lib/constants'
import {countLines} from '#/lib/strings/helpers'
import {usePrivatePostsEnabled} from '#/state/preferences/private-posts-enabled'
import {usePrivatePost} from '#/state/queries/private-posts'
import {atoms as a, useTheme} from '#/alf'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {IS_DEV} from '#/env'
import {PostEmbedViewContext} from '../types'

function InvalidEmbed({reason}: {reason: string}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.transition_color,
        a.flex_col,
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
        {backgroundColor: '#ffffff00'},
      ]}>
      <View style={[a.p_md, a.flex_row]}>
        <CircleXIcon style={[a.pr_sm, t.atoms.text_contrast_medium]} />
        <Text style={[a.text_md]}>{reason}</Text>
      </View>
    </View>
  )
}

export function PrivatePostEmbed({
  author = undefined,
  uri,
  cid,
  viewContext = PostEmbedViewContext.ThreadHighlighted,
  style = [],
  textOnly = false,
  numberOfLines = undefined,
}: {
  author: string | undefined
  uri: string
  cid: string
  viewContext: PostEmbedViewContext | undefined
  style: StyleProp<TextStyle> | undefined
  textOnly: boolean | undefined
  numberOfLines: number | undefined
}) {
  const privatePostsEnabled = usePrivatePostsEnabled()
  const privatePostQuery = usePrivatePost(uri, cid)
  const t = useTheme()
  const postText =
    typeof privatePostQuery.data?.text === 'string'
      ? privatePostQuery.data.text
      : ''
  const richText = useMemo(
    () =>
      new RichTextApi({
        text: postText,
        facets: privatePostQuery.data?.descriptionFacets,
      }),
    [postText, privatePostQuery.data?.descriptionFacets],
  )
  const [limitLines, setLimitLines] = useState(false)

  useEffect(() => {
    setLimitLines(countLines(postText) >= MAX_POST_LINES)
  }, [postText])

  if (!privatePostsEnabled) return <InvalidEmbed reason="Private post" />
  if (!uri.startsWith('at://')) {
    return <InvalidEmbed reason="Invalid private post" />
  }
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/.test(cid)) {
    return <InvalidEmbed reason="Invalid private post" />
  }
  if (!IS_DEV && author && !uri.startsWith(`at://${author}/`)) {
    return <InvalidEmbed reason="Cannot embed somebody else's private post" />
  }
  if (privatePostQuery.isPending) {
    return <InvalidEmbed reason="Loading private post…" />
  }
  if (privatePostQuery.isError || !privatePostQuery.data) {
    const reason =
      privatePostQuery.error instanceof Error
        ? privatePostQuery.error.message
        : 'Private post unavailable'
    return <InvalidEmbed reason={reason} />
  }

  const post = privatePostQuery.data
  if (post.error || typeof post.text !== 'string') {
    return <InvalidEmbed reason={post.error || 'Private post unavailable'} />
  }

  return (
    <View style={[a.w_full, a.flex_col]}>
      <View style={[a.flex_row, a.align_center, a.mb_2xs]}>
        <LockIcon style={[a.mr_xs, t.atoms.text_contrast_medium]} />
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Private post
        </Text>
      </View>

      {textOnly && (
        <Text style={style} numberOfLines={numberOfLines} emoji>
          {postText}
        </Text>
      )}
      {!textOnly && (
        <RichText
          enableTags
          testID="postText"
          value={richText}
          numberOfLines={limitLines ? MAX_POST_LINES : undefined}
          style={[
            viewContext === PostEmbedViewContext.ThreadHighlighted
              ? a.text_lg
              : a.text_md,
          ]}
          shouldProxyLinks={true}
        />
      )}
    </View>
  )
}

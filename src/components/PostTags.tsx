import {type StyleProp, View, type ViewStyle} from 'react-native'
import {AppBskyFeedPost, type AppBskyFeedDefs} from '@atproto/api'

import {atoms as a, tokens, useTheme} from '#/alf'
import {RichTextTag} from '#/components/RichTextTag'

/**
 * Renders outline tags from `app.bsky.feed.post` `tags` (separate from
 * in-text hashtag facets).
 */
export function PostTags({
  post,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const tags = getOutlineTags(post)

  if (!tags.length) {
    return null
  }

  return (
    <View
      style={[
        a.flex_row,
        a.flex_wrap,
        a.pt_2xs,
        {
          columnGap: tokens.space.sm,
          rowGap: tokens.space._2xs,
        },
        style,
      ]}>
      {tags.map(tag => (
        <RichTextTag
          key={tag}
          tag={tag}
          display={`#${tag}`}
          authorHandle={post.author.handle}
          textStyle={[a.text_sm, t.atoms.text_contrast_medium]}
        />
      ))}
    </View>
  )
}

function getOutlineTags(post: AppBskyFeedDefs.PostView): string[] {
  if (!AppBskyFeedPost.isRecord(post.record)) {
    return []
  }
  const tags = post.record.tags
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === 'string')
    : []
}

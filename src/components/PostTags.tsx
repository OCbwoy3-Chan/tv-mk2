import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'

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
        a.pt_xs,
        {gap: tokens.space._2xs},
        style,
      ]}>
      {tags.map(tag => (
        <Pressable
          key={tag}
          role="presentation"
          style={({hovered, pressed}) => [
            a.rounded_full,
            hovered || pressed
              ? t.atoms.bg_contrast_50
              : t.atoms.bg_contrast_25,
            {paddingHorizontal: 6, paddingVertical: 3},
          ]}>
          <RichTextTag
            tag={tag}
            display={`#${tag}`}
            authorHandle={post.author.handle}
            textStyle={[
              a.text_sm,
              a.font_normal,
              a.leading_tight,
              t.atoms.text_contrast_high,
            ]}
            disableUnderline
          />
        </Pressable>
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

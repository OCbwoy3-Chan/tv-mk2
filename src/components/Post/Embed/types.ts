import {type StyleProp, type ViewStyle} from 'react-native'
import {type ModerationDecision} from '@bsky/sdk/moderation'

import {type app} from '#/lexicons'

export enum PostEmbedViewContext {
  ThreadHighlighted = 'ThreadHighlighted',
  Feed = 'Feed',
  FeedCarousel = 'FeedCarousel',
  FeedEmbedRecordWithMedia = 'FeedEmbedRecordWithMedia',
  ChatMessage = 'ChatMessage',
}

export type CommonProps = {
  moderation?: ModerationDecision
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  viewContext?: PostEmbedViewContext
  isWithinQuote?: boolean
  allowNestedQuotes?: boolean
  showPronouns?: boolean
  /** Hides a quoted-post record while leaving any accompanying media visible. */
  hideRecordEmbedUri?: string
  /**
   * The post that contains this embed. Used for analytics on photo embed
   * events (post:photoEmbed:*). When the embed has no owning post (e.g.
   * composer previews), leave this undefined and no events will be emitted.
   */
  post?: app.bsky.feed.defs.PostView
  feedDescriptor?: string
}

export type EmbedProps = CommonProps & {
  embed?: app.bsky.feed.defs.PostView['embed']
}

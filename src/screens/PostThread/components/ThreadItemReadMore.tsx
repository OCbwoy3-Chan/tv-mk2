import {memo} from 'react'
import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {
  type PostThreadParams,
  type ThreadItem,
} from '#/state/queries/usePostThread'
import {useContinueReaderThread} from '#/state/queries/usePostThread/useContinueReaderThread'
import {
  LINEAR_AVI_WIDTH,
  READER_LINE_INDENT,
  READER_SEAM_HEIGHT,
  REPLY_LINE_WIDTH,
  TREE_AVI_WIDTH,
  TREE_INDENT,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {CirclePlus_Stroke2_Corner0_Rounded as CirclePlus} from '#/components/icons/CirclePlus'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

/** Align the continuation button with the reader content. */
const READER_BUTTON_INSET = 14

export const ThreadItemReadMore = memo(function ThreadItemReadMore({
  item,
  view,
}: {
  item: Extract<ThreadItem, {type: 'readMore'}>
  view: PostThreadParams['view'] | 'reader'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const isTreeView = view === 'tree'
  const isReader = view === 'reader'
  const indent = Math.max(0, item.depth - 1)

  const spacers = isTreeView
    ? Array.from(Array(indent)).map((_, n: number) => {
        const isSkipped = item.skippedIndentIndices.has(n)
        return (
          <View
            key={`${item.key}-padding-${n}`}
            style={[
              t.atoms.border_contrast_low,
              {
                borderRightWidth: isSkipped ? 0 : REPLY_LINE_WIDTH,
                width: TREE_INDENT + TREE_AVI_WIDTH / 2,
                left: 1,
              },
            ]}
          />
        )
      })
    : null

  if (isReader) {
    return (
      <View
        style={[
          a.flex_row,
          a.align_center,
          {
            height: READER_SEAM_HEIGHT,
            paddingLeft: READER_LINE_INDENT + READER_BUTTON_INSET,
          },
        ]}>
        <ReaderContinueButton />
      </View>
    )
  }

  return (
    <View style={[a.flex_row]}>
      {spacers}
      <View
        style={[
          t.atoms.border_contrast_low,
          {
            marginLeft: isTreeView
              ? TREE_INDENT + TREE_AVI_WIDTH / 2 - 1
              : (LINEAR_AVI_WIDTH - REPLY_LINE_WIDTH) / 2 + 16,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            borderBottomLeftRadius: a.rounded_sm.borderRadius,
            height: 18, // magic, Link below is 38px tall
            width: isTreeView ? TREE_INDENT : LINEAR_AVI_WIDTH / 2 + 10,
          },
        ]}
      />
      <Link
        dataSet={{keyboardNavigationItem: 'true'}}
        label={l`Read more replies`}
        to={item.href}
        style={[a.pt_sm, a.pb_md, a.gap_xs]}>
        {({hovered, pressed}) => {
          const interacted = hovered || pressed
          return (
            <>
              <CirclePlus
                fill={
                  interacted
                    ? t.atoms.text_contrast_high.color
                    : t.atoms.text_contrast_low.color
                }
                width={18}
              />
              <Text
                style={[
                  a.text_sm,
                  t.atoms.text_contrast_medium,
                  interacted && a.underline,
                ]}>
                <Trans>
                  Read{' '}
                  <Plural
                    one="# more reply"
                    other="# more replies"
                    value={item.moreReplies}
                  />
                </Trans>
              </Text>
            </>
          )
        }}
      </Link>
    </View>
  )
})

/** Keeps long-thread continuation in the current reader instead of navigating. */
function ReaderContinueButton() {
  const {t: l} = useLingui()
  const continuation = useContinueReaderThread()

  if (continuation.isSuccess && !continuation.data) {
    return (
      <Text style={a.text_sm}>
        <Trans>
          No more posts in this thread. Open replies to see other responses.
        </Trans>
      </Text>
    )
  }

  return (
    <Button
      testID="readerLoadMore"
      {...{
        dataSet: {
          keyboardNavigationItem: 'true',
          keyboardNavigationClickable: 'true',
        },
      }}
      label={
        continuation.isError ? l`Retry loading thread` : l`Continue reading`
      }
      color="secondary"
      size="small"
      disabled={continuation.isPending}
      onPress={() => continuation.mutate()}>
      <ButtonText>
        {continuation.isPending ? (
          <Trans>Loading…</Trans>
        ) : continuation.isError ? (
          <Trans>Couldn’t load more posts. Retry</Trans>
        ) : (
          <Trans>Continue reading</Trans>
        )}
      </ButtonText>
    </Button>
  )
}

import {useCallback, useRef} from 'react'
import {FlatList, ScrollView, View} from 'react-native'
import {Plural, useLingui} from '@lingui/react/macro'

import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {type FeedPostSlice} from '#/state/queries/post-feed'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {
  ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRight,
} from '#/components/icons/Chevron'
import {ITEM_GAP} from '#/components/images/Gallery/const'
import {tween} from '#/components/images/Gallery/tween'
import {useKeyboardHandlers} from '#/components/images/Gallery/useKeyboardHandlers'
import {usePointerHandlers} from '#/components/images/Gallery/usePointerHandlers'
import {getOffsetForIndex} from '#/components/images/Gallery/utils'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_WEB} from '#/env'
import {PostFeedItem} from './PostFeedItem'

const CARD_WIDTH = 320
const CARD_INTERVAL = CARD_WIDTH + ITEM_GAP
const SETTLE_DURATION = 700

function RepostCard({
  slice,
  itemRef,
}: {
  slice: FeedPostSlice
  itemRef?: (node: View | null) => void
}) {
  const t = useTheme()
  const item = slice.items[0]

  return (
    <View
      ref={itemRef}
      style={[
        {
          width: CARD_WIDTH,
          alignSelf: 'flex-start',
        },
        a.rounded_md,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.flex_shrink_0,
        a.overflow_hidden,
      ]}>
      <PostFeedItem
        post={item.post}
        record={item.record}
        reason={slice.reason}
        feedContext={slice.feedContext}
        moderation={item.moderation}
        parentAuthor={item.parentAuthor}
        isParentBlocked={item.isParentBlocked}
        isParentNotFound={item.isParentNotFound}
        hideTopBorder={true}
        isCarouselItem={true}
        rootPost={slice.items[0].post}
        showReplyTo={false}
        reqId={undefined}
      />
    </View>
  )
}

function RepostCarouselHeader({
  count,
  onScrollLeft,
  onScrollRight,
}: {
  count: number
  onScrollLeft: () => void
  onScrollRight: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const enableSquareButtons = useEnableSquareButtons()

  return (
    <View
      style={[
        a.py_lg,
        a.px_md,
        a.pb_xs,
        a.flex_row,
        a.align_center,
        a.justify_between,
      ]}>
      <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
        {count} <Plural value={count} one="repost" other="reposts" />
      </Text>
      <View style={[a.gap_md, a.flex_row, a.align_end]}>
        <Button
          label={l`Scroll carousel left`}
          size="tiny"
          variant="ghost"
          color="secondary"
          shape={enableSquareButtons ? 'square' : 'round'}
          onPress={onScrollLeft}>
          <ButtonIcon icon={ChevronLeft} />
        </Button>
        <Button
          label={l`Scroll carousel right`}
          size="tiny"
          variant="ghost"
          color="secondary"
          shape={enableSquareButtons ? 'square' : 'round'}
          onPress={onScrollRight}>
          <ButtonIcon icon={ChevronRight} />
        </Button>
      </View>
    </View>
  )
}

function RepostCarouselNative({items}: {items: FeedPostSlice[]}) {
  const scrollRef = useRef<ScrollView>(null)
  const currentIndexRef = useRef(0)

  const scrollToIndex = useCallback((index: number) => {
    currentIndexRef.current = index
    scrollRef.current?.scrollTo({
      x: index * CARD_INTERVAL,
      y: 0,
      animated: true,
    })
  }, [])

  const scrollLeft = useCallback(() => {
    const current = currentIndexRef.current
    const next = current > 0 ? current - 1 : items.length - 1
    scrollToIndex(next)
  }, [items.length, scrollToIndex])

  const scrollRight = useCallback(() => {
    const current = currentIndexRef.current
    const next = current < items.length - 1 ? current + 1 : 0
    scrollToIndex(next)
  }, [items.length, scrollToIndex])

  return (
    <>
      <RepostCarouselHeader
        count={items.length}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />
      <BlockDrawerGesture>
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_INTERVAL}
          decelerationRate="fast"
          onMomentumScrollEnd={e => {
            currentIndexRef.current = Math.round(
              e.nativeEvent.contentOffset.x / CARD_INTERVAL,
            )
          }}
          contentContainerStyle={[
            a.px_md,
            a.pt_sm,
            a.pb_lg,
          ]}>
          <View
            style={[
              a.flex_row,
              a.align_start,
              {gap: ITEM_GAP},
            ]}>
            {items.map(slice => (
              <RepostCard key={slice.items[0]._reactKey} slice={slice} />
            ))}
          </View>
        </ScrollView>
      </BlockDrawerGesture>
    </>
  )
}

function RepostCarouselWeb({items}: {items: FeedPostSlice[]}) {
  const {t: l} = useLingui()
  const flatListRef = useRef<FlatList>(null)
  const itemWidthsRef = useRef<Map<number, number>>(new Map())
  const itemRefsRef = useRef<Map<number, View>>(new Map())
  const currentIndexRef = useRef(0)
  const stopTweenRef = useRef<(() => void) | null>(null)

  const scrollTo = useCallback((offset: number) => {
    flatListRef.current?.scrollToOffset({offset, animated: false})
  }, [])

  const onSettle = useCallback((index: number) => {
    currentIndexRef.current = index
    itemRefsRef.current.forEach((node, i) => {
      const el = node as unknown as HTMLElement
      el.tabIndex = i === index ? 0 : -1
    })
    const el = itemRefsRef.current.get(index) as unknown as HTMLElement | null
    el?.focus({preventScroll: true})
  }, [])

  const scrollToIndex = useCallback(
    (index: number) => {
      const el =
        flatListRef.current?.getScrollableNode() as unknown as
          | HTMLElement
          | null
      if (!el) return

      if (stopTweenRef.current) {
        stopTweenRef.current()
        stopTweenRef.current = null
      }

      const from = el.scrollLeft
      const to = getOffsetForIndex(itemWidthsRef.current, index)
      if (from === to) {
        onSettle(index)
        return
      }

      stopTweenRef.current = tween(
        from,
        to,
        SETTLE_DURATION,
      )(
        v => {
          scrollTo(v)
        },
        () => {
          stopTweenRef.current = null
          onSettle(index)
        },
      )
    },
    [onSettle, scrollTo],
  )

  const scrollLeft = useCallback(() => {
    const current = currentIndexRef.current
    const next = current > 0 ? current - 1 : items.length - 1
    scrollToIndex(next)
  }, [items.length, scrollToIndex])

  const scrollRight = useCallback(() => {
    const current = currentIndexRef.current
    const next = current < items.length - 1 ? current + 1 : 0
    scrollToIndex(next)
  }, [items.length, scrollToIndex])

  useKeyboardHandlers({
    flatListRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    imageCount: items.length,
  })

  usePointerHandlers({
    flatListRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    imageCount: items.length,
  })

  return (
    <>
      <RepostCarouselHeader
        count={items.length}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />
      <BlockDrawerGesture>
        <View style={[a.w_full, a.overflow_hidden]}>
          <FlatList
            ref={flatListRef}
            role="group"
            aria-roledescription={l`carousel`}
            aria-label={l`Repost carousel, ${items.length} reposts`}
            horizontal
            pagingEnabled={false}
            overScrollMode={IS_ANDROID ? 'never' : 'auto'}
            showsHorizontalScrollIndicator={false}
            directionalLockEnabled
            nestedScrollEnabled
            alwaysBounceVertical={false}
            scrollEventThrottle={16}
            data={items}
            keyExtractor={slice => slice.items[0]._reactKey}
            renderItem={({item: slice, index}) => {
              itemWidthsRef.current.set(index, CARD_WIDTH)

              return (
                <RepostCard
                  slice={slice}
                  itemRef={node => {
                    if (node) {
                      itemRefsRef.current.set(index, node)
                    } else {
                      itemRefsRef.current.delete(index)
                    }
                  }}
                />
              )
            }}
            style={[a.w_full, web({overscrollBehaviorX: 'contain'})]}
            contentContainerStyle={[
              a.px_md,
              a.pt_sm,
              a.pb_lg,
              {gap: ITEM_GAP, alignItems: 'flex-start'},
            ]}
          />
        </View>
      </BlockDrawerGesture>
    </>
  )
}

export function PostFeedItemCarousel({items}: {items: FeedPostSlice[]}) {
  const t = useTheme()

  return (
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      {IS_WEB ? (
        <RepostCarouselWeb items={items} />
      ) : (
        <RepostCarouselNative items={items} />
      )}
    </View>
  )
}

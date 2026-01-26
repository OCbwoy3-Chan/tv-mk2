import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react'
import {
  findNodeHandle,
  type ListRenderItemInfo,
  useWindowDimensions,
  View,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useLinkatBoardQuery} from '#/state/queries/linkat'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List, type ListRef} from '#/view/com/util/List'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme} from '#/alf'
import {ChainLink_Stroke2_Corner0_Rounded as LinkIcon} from '#/components/icons/ChainLink'
import {Link as InternalLink} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {type SectionRef} from './types'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}

interface Props {
  ref?: React.Ref<SectionRef>
  did: string
  headerHeight: number
  isFocused: boolean
  scrollElRef: ListRef
  setScrollViewTag: (tag: number | null) => void
}

export function ProfileLinkatSection({
  ref,
  did,
  headerHeight,
  isFocused,
  scrollElRef,
  setScrollViewTag,
}: Props) {
  const {_} = useLingui()
  const {height} = useWindowDimensions()
  const {data: linkatBoard, isLoading} = useLinkatBoardQuery(did)

  const items = useMemo(() => {
    let listItems: any[] = []

    if (isLoading) {
      listItems = listItems.concat([LOADING])
    } else if (
      !linkatBoard ||
      !linkatBoard.cards ||
      linkatBoard.cards.length === 0
    ) {
      listItems = listItems.concat([EMPTY])
    } else {
      listItems = listItems.concat(
        linkatBoard.cards.map((card, index) => ({
          ...card,
          _reactKey: `link-${index}`,
        })),
      )
    }

    return listItems
  }, [linkatBoard, isLoading])

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: true,
      offset: -headerHeight,
    })
  }, [scrollElRef, headerHeight])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<any>) => {
      if (item === EMPTY) {
        return (
          <View
            style={[
              a.flex_1,
              a.align_center,
              {
                minHeight: height - headerHeight,
                paddingTop: headerHeight,
              },
            ]}>
            <EmptyState
              icon={LinkIcon}
              iconSize="3xl"
              message={_(msg`No links yet`)}
            />
          </View>
        )
      } else if (item === LOADING) {
        return (
          <View style={{paddingTop: headerHeight}}>
            <FeedLoadingPlaceholder />
          </View>
        )
      }

      return <LinkatCard card={item} />
    },
    [_, height, headerHeight],
  )

  useEffect(() => {
    if (IS_NATIVE && isFocused && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  return (
    <View testID="linkatSection">
      <List
        testID="linkatList"
        ref={scrollElRef}
        data={items}
        keyExtractor={(item: any) => item._reactKey}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: headerHeight,
          minHeight: height,
        }}
        style={{flex: 1}}
        // @ts-ignore web only -prf
        desktopFixedHeight={IS_NATIVE ? undefined : height}
      />
    </View>
  )
}

function LinkatCard({
  card,
}: {
  card: {url: string; text: string; emoji?: string}
}) {
  const t = useTheme()

  return (
    <InternalLink
      to={card.url}
      label={card.text}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.px_lg,
        a.py_lg,
        a.border_b,
        t.atoms.border_contrast_low,
        t.atoms.bg,
      ]}
      hoverStyle={[t.atoms.bg_contrast_25]}>
      {card.emoji && (
        <View
          style={[
            a.justify_center,
            a.align_center,
            {
              width: 48,
              height: 48,
            },
          ]}>
          <Text style={[{fontSize: 32}]} selectable={false}>
            {card.emoji}
          </Text>
        </View>
      )}
      <View style={[a.flex_1, {minWidth: 0}]}>
        <Text
          style={[a.text_md, a.font_semibold, a.leading_snug, t.atoms.text]}
          numberOfLines={1}>
          {card.text}
        </Text>
        <Text
          style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {new URL(card.url).hostname}
        </Text>
      </View>
      <View style={[a.justify_center, a.align_center, {width: 24, height: 24}]}>
        <LinkIcon size="md" style={t.atoms.text_contrast_medium} />
      </View>
    </InternalLink>
  )
}

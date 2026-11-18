import {useMemo, useRef, useState} from 'react'
import {type ListRenderItemInfo, useWindowDimensions, View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {List, type ListMethods} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {useEventQuery, useEventRsvpsQuery} from '#/features/events/queries'
import {type ParsedEvent, parseEventRecord} from '#/features/events/record'
import {
  type EventView,
  RSVP_GOING,
  RSVP_INTERESTED,
  type RsvpStatus,
  type RsvpView,
} from '#/features/events/types'
import {eventAtUri, makeEventUrl} from '#/features/events/url'
import {EventHeader} from './EventHeader'
import {GuestTabs} from './GuestTabs'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Event'>

export function EventScreen({route}: Props) {
  const {t: l} = useLingui()
  const {name, rkey} = route.params
  const {data: did, error: resolveError} = useResolveDidQuery(name)
  const uri = did ? eventAtUri(did, rkey) : undefined
  const {data: event, isLoading, error, refetch} = useEventQuery(uri)
  const parsed = event ? parseEventRecord(event.record) : undefined
  const squareButtons = useEnableSquareButtons()

  return (
    <Layout.Screen testID="eventScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Event</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          {event && (
            <Button
              label={l`Share event`}
              size="small"
              variant="ghost"
              color="primary"
              shape={squareButtons ? 'square' : 'round'}
              hitSlop={HITSLOP_10}
              style={[{right: -3}]}
              onPress={() => void shareUrl(makeEventUrl(event.creator, rkey))}>
              <ButtonIcon icon={ShareIcon} size="md" />
            </Button>
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      {event && parsed ? (
        <EventBody event={event} parsed={parsed} />
      ) : (
        <ListMaybePlaceholder
          isLoading={isLoading || (!did && !resolveError)}
          isError={
            !!error || !!resolveError || event === null || (!!event && !parsed)
          }
          errorTitle={l`Event not found`}
          errorMessage={
            resolveError
              ? cleanError(resolveError)
              : error
                ? l`Couldn't load this event. Try again in a moment.`
                : l`This event may have been deleted or isn't available.`
          }
          onRetry={error ? refetch : undefined}
          topBorder={false}
          sideBorders={false}
        />
      )}
    </Layout.Screen>
  )
}

const GUEST_STATUSES: RsvpStatus[] = [RSVP_GOING, RSVP_INTERESTED]
/** Room taken by the header and bottom bar, which the list scrolls under. */
const SCREEN_CHROME_HEIGHT = 120

function EventBody({event, parsed}: {event: EventView; parsed: ParsedEvent}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {height: windowHeight} = useWindowDimensions()
  const listRef = useRef<ListMethods>(null)
  const scrollY = useRef(0)
  const tabsLayout = useRef({y: 0, height: 0})
  const [tab, setTab] = useState(0)
  const status = GUEST_STATUSES[tab]

  /*
   * The counts in the header open their tab. The list only scrolls when the
   * tab bar is off screen: scrolling it to the top regardless clamps to the
   * bottom of a short list, which reads as a jump to nowhere.
   */
  const showGuests = (next: RsvpStatus) => {
    setTab(GUEST_STATUSES.indexOf(next))
    const {y, height} = tabsLayout.current
    const visible =
      y >= scrollY.current &&
      y + height <= scrollY.current + windowHeight - SCREEN_CHROME_HEIGHT
    if (!visible) {
      listRef.current?.scrollToOffset({offset: y, animated: true})
    }
  }

  const {
    data,
    refetch,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventRsvpsQuery(event.uri, status)
  const rsvps = useMemo(
    () => data?.pages.flatMap(page => page.rsvps) ?? [],
    [data],
  )
  const mutedOrBlockedCount = data?.pages[0]?.mutedOrBlockedCount ?? 0

  // The header avatars come from the unfiltered query, so they do not shift
  // when the guest list tab changes.
  const {data: everyone} = useEventRsvpsQuery(event.uri, undefined)
  const everyoneRsvps = everyone?.pages.flatMap(page => page.rsvps) ?? []
  const going = everyoneRsvps
    .filter(rsvp => rsvp.status === RSVP_GOING)
    .slice(0, 5)
    .map(rsvp => rsvp.actor)
  const interested = everyoneRsvps
    .filter(rsvp => rsvp.status === RSVP_INTERESTED)
    .slice(0, 5)
    .map(rsvp => rsvp.actor)

  const renderItem = ({item, index}: ListRenderItemInfo<RsvpView>) => (
    <GuestItem rsvp={item} noBorder={index === 0} />
  )

  return (
    <List
      ref={listRef}
      onScrollOffsetChange={offset => (scrollY.current = offset)}
      data={rsvps}
      keyExtractor={(item: RsvpView) => item.uri}
      renderItem={renderItem}
      ListHeaderComponent={
        <View>
          <EventHeader
            event={event}
            parsed={parsed}
            going={going}
            interested={interested}
            onPressGuests={showGuests}
          />
          <View onLayout={e => (tabsLayout.current = e.nativeEvent.layout)}>
            <GuestTabs
              items={[l`Going`, l`Interested`]}
              selected={tab}
              onSelect={setTab}
            />
          </View>
          {!isLoading && !error && rsvps.length === 0 && (
            <Text
              style={[
                a.px_lg,
                a.py_xl,
                a.text_md,
                a.text_center,
                t.atoms.text_contrast_medium,
              ]}>
              {status === RSVP_INTERESTED ? (
                <Trans>No one has marked themselves interested yet.</Trans>
              ) : (
                <Trans>No one is going yet.</Trans>
              )}
            </Text>
          )}
        </View>
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
      }}
      onEndReachedThreshold={2}
      ListFooterComponent={
        <View>
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={error ? l`Couldn't load the guest list.` : undefined}
            onRetry={rsvps.length ? fetchNextPage : refetch}
          />
          {mutedOrBlockedCount > 0 && (
            <MutedOrBlockedSection
              key={tab}
              eventUri={event.uri}
              status={status}
              count={mutedOrBlockedCount}
            />
          )}
        </View>
      }
      sideBorders={false}
    />
  )
}

function MutedOrBlockedSection({
  eventUri,
  status,
  count,
}: {
  eventUri: string
  status: RsvpStatus
  count: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [open, setOpen] = useState(false)
  const {data} = useEventRsvpsQuery(eventUri, status, 'mutedOrBlocked', open)
  const rsvps = data?.pages.flatMap(page => page.rsvps) ?? []

  return (
    <View style={[a.px_lg, a.py_md, a.border_t, t.atoms.border_contrast_low]}>
      <Button
        label={
          open
            ? l`Hide muted or blocked accounts`
            : l`Show muted or blocked accounts`
        }
        size="small"
        color="secondary"
        variant="ghost"
        style={[a.self_start]}
        onPress={() => setOpen(v => !v)}>
        <ButtonText>
          {plural(count, {
            one: '# muted or blocked account',
            other: '# muted or blocked accounts',
          })}
        </ButtonText>
      </Button>
      {open &&
        rsvps.map((item, index) => (
          <GuestItem key={item.uri} rsvp={item} noBorder={index === 0} />
        ))}
    </View>
  )
}

/** One guest, as a standard profile row with a follow button. */
function GuestItem({rsvp, noBorder}: {rsvp: RsvpView; noBorder?: boolean}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  if (!moderationOpts) return null
  return (
    <View
      style={[
        a.px_lg,
        a.py_md,
        !noBorder && [a.border_t, t.atoms.border_contrast_low],
      ]}>
      <ProfileCard.Default
        profile={rsvp.actor}
        moderationOpts={moderationOpts}
      />
    </View>
  )
}

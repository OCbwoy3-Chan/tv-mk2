import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Text} from '#/components/Typography'
import {eventPlace, formatEventTime} from '../format'
import {useRsvpsQuery} from '../queries'
import {type ParsedEvent} from '../record'
import {type EventView, RSVP_GOING} from '../types'
import {LiveWatchButton} from './LiveWatchButton'

export function EventMeta({
  event,
  parsed,
}: {
  event: EventView
  parsed: ParsedEvent
}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const time = formatEventTime(i18n, parsed)
  const place = eventPlace(_, parsed)

  return (
    <View style={[a.gap_xs]}>
      {time && (
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <ClockIcon size="sm" style={[t.atoms.text_contrast_medium]} />
          <Text
            numberOfLines={1}
            style={[a.text_sm, t.atoms.text_contrast_medium, a.flex_1]}>
            {time}
          </Text>
        </View>
      )}
      {place && (
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          {parsed.location ? (
            <PinIcon size="sm" style={[t.atoms.text_contrast_medium]} />
          ) : (
            <GlobeIcon size="sm" style={[t.atoms.text_contrast_medium]} />
          )}
          <Text
            numberOfLines={1}
            style={[a.text_sm, t.atoms.text_contrast_medium, a.flex_1]}>
            {place}
          </Text>
          <LiveWatchButton parsed={parsed} />
        </View>
      )}
      <RsvpCounts event={event} />
    </View>
  )
}

/**
 * Both counts on one line, with avatars of people going only: interested
 * avatars are left to the event page, where there is room to tell them apart.
 * People the viewer follows come first when the AppView supplies them.
 */
function RsvpCounts({event}: {event: EventView}) {
  const t = useTheme()
  const known = event.knownGoing ?? []
  const going = useRsvpsQuery(
    event.uri,
    RSVP_GOING,
    known.length === 0 && event.goingCount > 0,
  )
  const avatars = (
    known.length > 0 ? known : (going.data?.rsvps.map(r => r.actor) ?? [])
  ).slice(0, 5)
  const goingLabel = plural(event.goingCount, {
    one: '# going',
    other: '# going',
  })

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.pt_2xs]}>
      {avatars.length > 0 && <AvatarStack profiles={avatars} size={20} />}
      <Text
        numberOfLines={1}
        style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}>
        {event.interestedCount > 0
          ? `${goingLabel} · ${plural(event.interestedCount, {
              one: '# interested',
              other: '# interested',
            })}`
          : goingLabel}
      </Text>
    </View>
  )
}

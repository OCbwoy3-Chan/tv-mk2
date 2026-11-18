import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, utils} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonText} from '#/components/Button'
import {useRichText} from '#/components/hooks/useRichText'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {InlineLinkText} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {Poster} from '#/features/events/components/Poster'
import {RsvpButtons} from '#/features/events/components/RsvpButtons'
import {eventDateParts, eventPhase} from '#/features/events/format'
import {type ParsedEvent} from '#/features/events/record'
import {
  type EventView,
  RSVP_GOING,
  RSVP_INTERESTED,
  type RsvpStatus,
} from '#/features/events/types'
import {type app} from '#/lexicons'

export function EventHeader({
  event,
  parsed,
  going,
  interested,
  onPressGuests,
}: {
  event: EventView
  parsed: ParsedEvent
  going: app.bsky.actor.defs.ProfileViewBasic[]
  interested: app.bsky.actor.defs.ProfileViewBasic[]
  /** Opens the guest list on the tab for a status. */
  onPressGuests: (status: RsvpStatus) => void
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const openLink = useOpenLink()
  const date = eventDateParts(i18n, parsed)
  const past = eventPhase(parsed, new Date()) === 'past'
  const otherLinks = parsed.links.filter(
    link => link.uri !== parsed.joinUrl && link.uri !== parsed.streamplaceUrl,
  )
  const place =
    parsed.location ??
    (parsed.streamplaceUrl || parsed.mode === 'virtual' ? l`Online` : undefined)

  return (
    <View style={[a.pb_xl]}>
      <View style={[a.align_center, a.px_lg, a.pt_lg, a.gap_lg]}>
        {parsed.cancelled && (
          <View
            style={[
              a.rounded_full,
              a.px_md,
              a.py_xs,
              {backgroundColor: t.palette.negative_500},
            ]}>
            <Text style={[a.text_sm, a.font_bold, {color: t.palette.white}]}>
              <Trans>Cancelled</Trans>
            </Text>
          </View>
        )}
        <Poster event={event} parsed={parsed} size={240} />
        <Text
          emoji
          style={[a.text_3xl, a.font_bold, a.text_center, a.leading_tight]}>
          {parsed.name}
        </Text>
        {date && (
          <View style={[a.align_center, a.gap_2xs]}>
            <Text style={[a.text_lg, a.font_semi_bold, a.text_center]}>
              {date.longDate}
            </Text>
            <Text
              style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
              {date.timeRange}
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
            <Text emoji style={[a.text_md, t.atoms.text_contrast_medium]}>
              {place}
            </Text>
          </View>
        )}
        {parsed.joinUrl && !parsed.cancelled && !past && (
          <Button
            label={l`Join online at ${toNiceDomain(parsed.joinUrl)}`}
            size="large"
            color="primary"
            onPress={() => openLink(parsed.joinUrl!, undefined, true)}>
            <ButtonText>
              <Trans>Join · {toNiceDomain(parsed.joinUrl)}</Trans>
            </ButtonText>
          </Button>
        )}
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <UserAvatar avatar={event.creator.avatar} size={28} type="user" />
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>
              Hosted by{' '}
              <InlineLinkText
                label={l`View host's profile`}
                to={`/profile/${event.creator.handle || event.creator.did}`}
                style={[a.text_md, a.font_semi_bold]}>
                {event.creator.displayName || `@${event.creator.handle}`}
              </InlineLinkText>
            </Trans>
          </Text>
        </View>
        {!parsed.cancelled && !past && (
          <View style={[a.w_full, {maxWidth: 420}]}>
            <RsvpButtons event={event} size="large" fill />
          </View>
        )}
        <GuestCounts
          event={event}
          going={going}
          interested={interested}
          onPress={onPressGuests}
        />
      </View>
      {parsed.description && <About description={parsed.description} />}
      {otherLinks.length > 0 && (
        <View
          style={[
            a.mx_lg,
            a.mt_md,
            a.p_lg,
            a.rounded_lg,
            a.gap_sm,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>Links</Trans>
          </Text>
          {otherLinks.map(link => (
            <InlineLinkText
              key={link.uri}
              label={link.name || link.uri}
              to={link.uri}
              style={[a.text_md]}>
              {link.name || toNiceDomain(link.uri)}
            </InlineLinkText>
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * The counts, each with the avatars of only that status beside it. Each one
 * opens the guest list on its tab.
 */
function GuestCounts({
  event,
  going,
  interested,
  onPress,
}: {
  event: EventView
  going: app.bsky.actor.defs.ProfileViewBasic[]
  interested: app.bsky.actor.defs.ProfileViewBasic[]
  onPress: (status: RsvpStatus) => void
}) {
  const {t: l} = useLingui()
  if (event.goingCount + event.interestedCount === 0) return null
  return (
    <View style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_xl]}>
      <CountRow
        label={plural(event.goingCount, {one: '# going', other: '# going'})}
        hint={l`Shows who is going`}
        avatars={going}
        onPress={() => onPress(RSVP_GOING)}
      />
      {event.interestedCount > 0 && (
        <CountRow
          label={plural(event.interestedCount, {
            one: '# interested',
            other: '# interested',
          })}
          hint={l`Shows who is interested`}
          avatars={interested}
          onPress={() => onPress(RSVP_INTERESTED)}
        />
      )}
    </View>
  )
}

function CountRow({
  label,
  hint,
  avatars,
  onPress,
}: {
  label: string
  hint: string
  avatars: app.bsky.actor.defs.ProfileViewBasic[]
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({pressed}) => [
        a.flex_row,
        a.align_center,
        a.gap_sm,
        pressed && {opacity: 0.7},
      ]}>
      {avatars.length > 0 && <AvatarStack profiles={avatars} size={28} />}
      <Text style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_high]}>
        {label}
      </Text>
    </Pressable>
  )
}

const ABOUT_COLLAPSED_HEIGHT = 180
/** Only collapse when it hides a real amount, not a stray last line. */
const ABOUT_COLLAPSE_SLACK = 48
const ABOUT_FADE_HEIGHT = 72

/**
 * Long descriptions are clipped with a fade and a "See more" over it. The text
 * is measured unclipped (the inner view keeps its natural height inside the
 * clipping one), so expanding never has to re-measure. Expanding is one-way and
 * lives in this component, so it resets when the screen is left.
 */
function About({description}: {description: string}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [overflows, setOverflows] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const collapsed = overflows && !expanded
  const bg = t.palette.contrast_25
  // Resolves @handles to DIDs so mentions link, as profile bios do.
  const [descriptionRT] = useRichText(description)

  return (
    <View
      style={[
        a.mx_lg,
        a.mt_xl,
        a.p_lg,
        a.rounded_lg,
        a.gap_sm,
        t.atoms.bg_contrast_25,
      ]}>
      <Text style={[a.text_md, a.font_bold]}>
        <Trans>About</Trans>
      </Text>
      <View
        style={[
          a.overflow_hidden,
          collapsed && {maxHeight: ABOUT_COLLAPSED_HEIGHT},
        ]}>
        <View
          onLayout={e =>
            setOverflows(
              e.nativeEvent.layout.height >
                ABOUT_COLLAPSED_HEIGHT + ABOUT_COLLAPSE_SLACK,
            )
          }>
          <RichText
            value={descriptionRT}
            enableTags
            style={[a.text_md, a.leading_snug]}
          />
        </View>
        {collapsed && (
          <>
            <LinearGradient
              key={t.name}
              pointerEvents="none"
              colors={[utils.alpha(bg, 0), bg]}
              style={[
                a.absolute,
                {left: 0, right: 0, bottom: 0, height: ABOUT_FADE_HEIGHT},
              ]}
            />
            <View
              pointerEvents="box-none"
              style={[
                a.absolute,
                a.align_center,
                {left: 0, right: 0, bottom: 0},
              ]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={l`See more`}
                accessibilityHint={l`Shows the full description`}
                hitSlop={HITSLOP_10}
                onPress={() => setExpanded(true)}>
                <Text
                  style={[
                    a.text_md,
                    a.font_semi_bold,
                    {color: t.palette.primary_500},
                  ]}>
                  <Trans>See more</Trans>
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

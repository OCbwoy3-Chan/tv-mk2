import {useEffect, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useSession} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {InlineLinkText} from '#/components/Link'
import {
  POLL_CHOICE_MIN_HEIGHT,
  POLL_CHOICE_TEXT,
  PollBar,
} from '#/components/Poll/PollBar'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {useTokimekiPoll} from '../api'
import {useTokimekiUnvoteMutation, useTokimekiVoteMutation} from '../mutations'
import {choicesFromLinkCard} from '../parse'
import {type TokimekiPoll, type TokimekiPollRef} from '../types'

const COUNTDOWN_TICK_MS = 60 * 1000
const FOOTER_LINE_HEIGHT = 20
/* Tall enough for the "Remove vote" button, so the line's height never changes. */
const footerRowStyle = [a.flex_row, a.align_center, a.gap_sm, {minHeight: 28}]
const POLL_PAGE = 'https://poll.tokimeki.tech/p'

/**
 * Renders a TOKIMEKI poll where a post has one as its link card. Falls back to
 * the ordinary link card when the poll cannot be read, so a dead poll or a
 * plain link to the same host leaves no blank gap.
 */
export function TokimekiPollEmbed({
  ref: pollRef,
  link,
  onOpen,
  style,
}: {
  ref: TokimekiPollRef
  link: app.bsky.embed.external.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {data, isLoading, isError} = useTokimekiPoll({
    ref: pollRef,
    enabled: true,
  })
  if (isError || (data === null && !isLoading)) {
    return <ExternalEmbed link={link} onOpen={onOpen} style={style} />
  }
  return (
    <PollBody
      poll={data}
      pollRef={pollRef}
      link={link}
      onOpen={onOpen}
      style={style}
    />
  )
}

function PollBody({
  poll,
  pollRef,
  link,
  onOpen,
  style,
}: {
  poll: TokimekiPoll | null | undefined
  pollRef: TokimekiPollRef
  link?: app.bsky.embed.external.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const vote = useTokimekiVoteMutation(poll, currentAccount?.did ?? '')
  const unvote = useTokimekiUnvoteMutation(poll, currentAccount?.did ?? '')
  const unvotePrompt = Prompt.usePromptControl()
  const [now, setNow] = useState(() => Date.now())
  const timeUntil = useGetTimeAgo({future: true})
  useEffect(() => {
    if (!poll?.endsAt) return
    const end = new Date(poll.endsAt).getTime()
    if (end <= now) return
    // Ticks each minute for the "Ends in" countdown, and once more at the end.
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(end - now, COUNTDOWN_TICK_MS),
    )
    return () => clearTimeout(timer)
  }, [poll?.endsAt, now])

  if (!poll) {
    /*
     * Same height as the loaded poll: TOKIMEKI's link card lists the choices
     * ("YES / NO"), so draw that many rows. A poll that grows once loaded
     * shoves the list around when it is above the screen.
     */
    const choices = choicesFromLinkCard(link?.description)
    return (
      <View testID="tokimekiPollLoading" style={[a.mt_sm, a.gap_sm, style]}>
        <View style={[a.gap_xs]}>
          {choices.map((choice, i) => (
            <View
              key={i}
              style={[
                a.justify_center,
                a.px_md,
                a.rounded_sm,
                t.atoms.bg_contrast_25,
                {minHeight: POLL_CHOICE_MIN_HEIGHT},
              ]}>
              <Text
                emoji
                numberOfLines={1}
                style={[POLL_CHOICE_TEXT, t.atoms.text_contrast_low]}>
                {choice}
              </Text>
            </View>
          ))}
        </View>
        <View style={footerRowStyle}>
          <Text
            style={[
              a.text_sm,
              {lineHeight: FOOTER_LINE_HEIGHT},
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>Loading poll…</Trans>
          </Text>
        </View>
      </View>
    )
  }

  const pollUrl = `${POLL_PAGE}/${encodeURIComponent(
    pollRef.did,
  )}/${encodeURIComponent(pollRef.rkey)}`
  const total = poll.totalVotes
  const topCount = Math.max(0, ...poll.counts)
  const ended = poll.endsAt ? now >= new Date(poll.endsAt).getTime() : false
  const canVoteHere = hasSession && !ended && poll.myVote === undefined
  /* Signed in on an open poll: voting, then taking it back, can happen here. */
  const canVote = hasSession && !ended
  const canUnvote = canVote && poll.myVote !== undefined
  const canPressUnvote =
    !unvote.isPending && !vote.isPending && !!poll.myVoteUris?.length

  /*
   * Drawn as part of the post rather than as a card: the choices sit under the
   * post text, with one quiet line of status below them.
   */
  return (
    <View testID="tokimekiPoll" style={[a.mt_sm, a.gap_sm, style]}>
      <View style={[a.gap_xs]}>
        {poll.options.map((option, i) => {
          const count = poll.counts[i] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const mine = poll.myVote === i
          return canVoteHere ? (
            <Button
              key={i}
              testID={`tokimekiPollOption_${i}`}
              label={option}
              onPress={() => vote.mutate(i)}
              disabled={vote.isPending}
              size="small"
              shape="rectangular"
              color="primary_subtle"
              style={[{minHeight: POLL_CHOICE_MIN_HEIGHT}]}>
              <ButtonText style={[POLL_CHOICE_TEXT, a.leading_snug]}>
                {option}
              </ButtonText>
            </Button>
          ) : (
            <PollBar
              key={i}
              label={option}
              pct={pct}
              mine={mine}
              winner={ended && total > 0 && count === topCount}
            />
          )
        })}
      </View>

      {vote.isError ? (
        <Text style={[a.text_xs, {color: t.palette.negative_500}]}>
          {vote.error.message}
        </Text>
      ) : null}

      <View style={footerRowStyle}>
        {/*
         * One line: when the TOKIMEKI credit doesn't fit beside the status, it
         * wraps onto a second line that is clipped away, separator and all.
         */}
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.flex_wrap,
            a.overflow_hidden,
            {height: FOOTER_LINE_HEIGHT},
          ]}>
          <Text
            numberOfLines={1}
            style={[
              a.text_sm,
              {lineHeight: FOOTER_LINE_HEIGHT, flexShrink: 1},
              t.atoms.text_contrast_medium,
            ]}>
            {total === 1 ? (
              <Trans>1 vote</Trans>
            ) : (
              <Trans>{formatCount(i18n, total)} votes</Trans>
            )}
            {ended ? (
              <>
                {' '}
                <Trans>· Ended</Trans>
              </>
            ) : poll.endsAt ? (
              <>
                {' '}
                <Trans comment="Time until a poll closes, e.g. “· 3 hours left”">
                  · {timeUntil(now, poll.endsAt, {format: 'long'})} left
                </Trans>
              </>
            ) : null}
          </Text>
          <Text
            style={[
              a.text_sm,
              {lineHeight: FOOTER_LINE_HEIGHT, flexShrink: 0},
              t.atoms.text_contrast_medium,
            ]}>
            {' · '}
            <InlineLinkText
              testID="tokimekiPollOpenBtn"
              to={pollUrl}
              label={l`Open poll on TOKIMEKI`}
              onPress={onOpen}
              style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans comment="Link to the poll on TOKIMEKI, the poll service">
                TOKIMEKI Poll
              </Trans>
            </InlineLinkText>
          </Text>
        </View>
        {/*
         * The slot is kept (invisible) on an open poll before voting, so the
         * button appearing doesn't push the post below down.
         */}
        {canVote && (
          <View
            style={!canUnvote && {opacity: 0}}
            pointerEvents={canUnvote ? 'auto' : 'none'}
            accessibilityElementsHidden={!canUnvote}
            importantForAccessibility={
              canUnvote ? 'auto' : 'no-hide-descendants'
            }>
            <Button
              testID="tokimekiPollUnvoteBtn"
              label={l`Remove your vote`}
              onPress={unvotePrompt.open}
              disabled={!canUnvote || !canPressUnvote}
              size="tiny"
              variant="ghost"
              color="secondary">
              <ButtonText>
                <Trans>Remove vote</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </View>
      <Prompt.Basic
        control={unvotePrompt}
        title={l`Remove your vote?`}
        description={
          poll.myVote !== undefined
            ? l`You voted for “${poll.options[poll.myVote]}”. You can vote again while the poll is open.`
            : l`You can vote again while the poll is open.`
        }
        confirmButtonCta={l`Remove vote`}
        confirmButtonColor="negative"
        onConfirm={() => unvote.mutate(poll.myVoteUris ?? [])}
      />
    </View>
  )
}

import {type ThreadPostPosition} from '#/screens/PostThread/reader'
import {atoms as a, useTheme} from '#/alf'
import {Span} from '#/components/Typography'

/**
 * Position indicator shown at the end of a post's text when it is part of a
 * self-thread in linear view, e.g. "(2/12)". Rendered inline via RichText's
 * `trailing` prop so it flows with the last line of text. Not translated: it
 * is purely numeric.
 *
 * Uses Span (raw RN Text) rather than our Text component so we do not apply
 * an absolute lineHeight from leading_snug + text_sm, which on native collapses
 * spacing for the whole parent paragraph.
 */
export function ThreadPositionChip({
  threadPosition,
}: {
  threadPosition: ThreadPostPosition
}) {
  const t = useTheme()

  return (
    <Span style={[a.text_sm, t.atoms.text_contrast_medium]}>
      {` (${threadPosition.position}/${threadPosition.postCount})`}
    </Span>
  )
}

import {splitFacetSyntax} from '#/lib/strings/rich-text-manip'
import {utils} from '#/alf'
import {Span} from '#/components/Typography'

/** Dim syntax that will be removed while keeping the editable text intact. */
export function SyntaxText({
  text,
  start,
  removalIndices,
  color,
}: {
  text: string
  start: number
  removalIndices: ReadonlySet<number>
  color: string
}) {
  return splitFacetSyntax(text, start, removalIndices).map((segment, index) => (
    <Span
      key={index}
      style={segment.removed ? {color: utils.alpha(color, 0.5)} : undefined}>
      {segment.text}
    </Span>
  ))
}

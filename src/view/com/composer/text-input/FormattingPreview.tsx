import {View} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Trans} from '@lingui/react/macro'

import {kindOf} from '#/lib/strings/formatting'
import {
  applyFacetSyntax,
  parseMarkdownLinks,
} from '#/lib/strings/rich-text-manip'
import {atoms as a, useTheme} from '#/alf'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

/** Keep the native editor's IME and selection intact; preview the posted facets. */
export function FormattingPreview({richtext}: {richtext: RichTextAPI}) {
  const t = useTheme()
  if (!richtext.facets?.some(facet => facet.features.some(kindOf))) return null
  const parsed = parseMarkdownLinks(richtext.text)
  const preview = new RichTextAPI({text: parsed.text})
  preview.detectFacetsWithoutResolution()
  preview.facets = [
    ...(preview.facets ?? []).filter(
      facet =>
        !parsed.facets.some(
          link =>
            facet.index.byteStart < link.index.byteEnd &&
            facet.index.byteEnd > link.index.byteStart,
        ),
    ),
    ...parsed.facets,
  ] as typeof preview.facets
  applyFacetSyntax(preview, {removeSyntax: true})
  return (
    <View
      testID="composerFormattingPreview"
      style={[
        a.gap_sm,
        a.mt_md,
        a.pt_md,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
        <Trans>Preview</Trans>
      </Text>
      <RichText value={preview} style={a.text_lg} disableLinks />
    </View>
  )
}

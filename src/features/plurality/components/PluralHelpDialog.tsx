import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRightIcon} from '#/components/icons/SquareArrowTopRight'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

const SERVICE_LINK = 'https://plural.host'
const INFO_LINK = 'https://morethanone.info'

export function PluralHelpDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Plurality & fronting`)}>
        <PluralHelpDialogInner />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function PluralHelpDialogInner() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const openLink = useOpenLink()

  const linkCardStyle = [
    a.flex_row,
    a.align_center,
    a.gap_md,
    a.p_md,
    a.rounded_md,
    {backgroundColor: t.palette.primary_500 + '14'},
    gtMobile && a.flex_1,
  ]

  return (
    <>
      <Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
        <Trans>Plurality & fronting</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>
          Plurality is when multiple self-aware entities exist together in one
          head; like lifelong roommates, but sharing a body rather than an
          apartment. Fronting refers to which member(s) of a system are
          currently present and active.
        </Trans>
      </Text>

      <View
        style={[
          a.pt_lg,
          a.gap_sm,
          gtMobile ? [a.flex_row, a.flex_wrap] : a.flex_col,
        ]}>
        <Link
          to={INFO_LINK}
          label={_(msg`Learn more about plurality`)}
          onPress={e => {
            e.preventDefault()
            openLink(INFO_LINK)
          }}
          style={linkCardStyle}>
          <SquareArrowTopRightIcon
            size="lg"
            style={{color: t.palette.primary_500, flexShrink: 0}}
          />
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>Learn More</Trans>
          </Text>
        </Link>

        <Link
          to={SERVICE_LINK}
          label={_(msg`Set up profile on plural.host`)}
          onPress={e => {
            e.preventDefault()
            openLink(SERVICE_LINK)
          }}
          style={linkCardStyle}>
          <GroupIcon
            size="lg"
            style={{color: t.palette.primary_500, flexShrink: 0}}
          />
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>Set Up Profile</Trans>
          </Text>
        </Link>
      </View>
    </>
  )
}

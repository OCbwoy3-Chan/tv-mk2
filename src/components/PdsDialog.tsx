import {useState} from 'react'
import {Image, View} from 'react-native'
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isBridgedPdsUrl, isBskyPdsUrl} from '#/state/queries/pds-label'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Fediverse as FediverseIcon} from '#/components/icons/Fediverse'
import {Mark as BskyMark} from '#/components/icons/Logo'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

function formatBskyPdsDisplayName(hostname: string): string {
  const match = hostname.match(/^([^.]+)\.([^.]+)\.host\.bsky\.network$/)
  if (match) {
    const name = match[1].charAt(0).toUpperCase() + match[1].slice(1)
    const rawRegion = match[2]
    const region = rawRegion
      .replace(/^us-east$/, 'US East')
      .replace(/^us-west$/, 'US West')
      .replace(/^eu-west$/, 'EU West')
      .replace(
        /^ap-(.+)$/,
        (_match: string, r: string) =>
          `AP ${r.charAt(0).toUpperCase()}${r.slice(1)}`,
      )
    return `${name} (${region})`
  }
  if (hostname === 'bsky.social') return 'Bluesky Social'
  return hostname
}

export function PdsDialog({
  control,
  pdsUrl,
  faviconUrl,
}: {
  control: Dialog.DialogControlProps
  pdsUrl: string
  faviconUrl: string
}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  let hostname = pdsUrl
  try {
    hostname = new URL(pdsUrl).hostname
  } catch {}

  const isBsky = isBskyPdsUrl(pdsUrl)
  const isBridged = isBridgedPdsUrl(pdsUrl)
  const displayName = isBsky ? formatBskyPdsDisplayName(hostname) : hostname

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`PDS Information`)}
        style={[
          gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
        ]}>
        <View style={[a.gap_md, a.pb_lg]}>
          <View style={[a.flex_row, a.align_center, a.gap_md]}>
            <FaviconOrGlobe
              faviconUrl={faviconUrl}
              isBsky={isBsky}
              isBridged={isBridged}
              size={36}
            />
            <View style={[a.flex_1]}>
              <Text
                style={[a.text_2xl, a.font_semi_bold, a.leading_tight]}
                numberOfLines={1}>
                {displayName}
              </Text>
              {isBsky && (
                <Text style={[a.text_sm]}>
                  <Trans>Bluesky-hosted PDS</Trans>
                </Text>
              )}
              {isBridged && (
                <Text style={[a.text_sm]}>
                  <Trans>Fediverse bridge</Trans>
                </Text>
              )}
            </View>
          </View>

          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              This account's data is stored on a Personal Data Server (PDS):{' '}
              <InlineLinkText
                to={pdsUrl}
                label={displayName}
                style={[a.text_md, a.font_semi_bold]}>
                {displayName}
              </InlineLinkText>
              {'. '}A PDS is where your posts, follows, and other data live on
              the AT Protocol network.
            </Trans>
          </Text>

          {isBridged && (
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                This account is bridged from the Fediverse via{' '}
                <InlineLinkText
                  to="https://fed.brid.gy"
                  label="Bridgy Fed"
                  style={[a.text_md, a.font_semi_bold]}>
                  Bridgy Fed
                </InlineLinkText>
                . Their original account lives on a Fediverse platform such as
                Mastodon.
              </Trans>
            </Text>
          )}

          {!isBsky && !isBridged && (
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                This account is self-hosted or uses a third-party PDS provider.
              </Trans>
            </Text>
          )}
        </View>

        <View
          style={[
            a.w_full,
            a.gap_sm,
            gtMobile
              ? [a.flex_row, a.flex_row_reverse, a.justify_start]
              : [a.flex_col],
          ]}>
          <Button
            label={_(msg`Close dialog`)}
            size="small"
            variant="solid"
            color="primary"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function FaviconOrGlobe({
  faviconUrl,
  isBsky,
  isBridged,
  size,
  borderRadius,
}: {
  faviconUrl: string
  isBsky: boolean
  isBridged: boolean
  size: number
  borderRadius?: number
}) {
  const t = useTheme()
  const [imgError, setImgError] = useState(false)
  const resolvedBorderRadius = borderRadius ?? size / 5

  if (isBsky) {
    return (
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.overflow_hidden,
          {
            width: size,
            height: size,
            borderRadius: resolvedBorderRadius,
            backgroundColor: '#0085ff',
          },
        ]}>
        <BskyMark width={Math.round(size * 0.8)} style={{color: '#fff'}} />
      </View>
    )
  }

  if (isBridged) {
    return (
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.overflow_hidden,
          {
            width: size,
            height: size,
            borderRadius: resolvedBorderRadius,
            backgroundColor: '#6364FF',
          },
        ]}>
        <FediverseIcon width={Math.round(size * 0.8)} style={{color: '#fff'}} />
      </View>
    )
  }

  if (!imgError && faviconUrl) {
    return (
      <View
        style={[
          a.overflow_hidden,
          a.align_center,
          a.justify_center,
          {
            width: size,
            height: size,
            borderRadius: resolvedBorderRadius,
            backgroundColor: t.atoms.bg_contrast_100.backgroundColor,
          },
        ]}>
        <Image
          source={{uri: faviconUrl}}
          style={{width: size, height: size}}
          onError={() => setImgError(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    )
  }

  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        {
          width: size,
          height: size,
          borderRadius: resolvedBorderRadius,
          backgroundColor: t.atoms.bg_contrast_100.backgroundColor,
        },
      ]}>
      <FontAwesomeIcon
        icon="database"
        size={Math.round(size * 0.7)}
        style={
          {color: t.atoms.text_contrast_medium.color} as FontAwesomeIconStyle
        }
      />
    </View>
  )
}

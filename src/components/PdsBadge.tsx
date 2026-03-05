import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {
  usePdsLabelEnabled,
  usePdsLabelHideBskyPds,
} from '#/state/preferences/pds-label'
import {usePdsFaviconQuery, usePdsLabelQuery} from '#/state/queries/pds-label'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PdsBadgeIcon, PdsDialog} from '#/components/PdsDialog'
import {IS_WEB} from '#/env'

export function PdsBadge({
  did,
  handle,
  size,
  interactive = true,
}: {
  did: string
  handle?: string
  size: 'lg' | 'md' | 'sm'
  interactive?: boolean
}) {
  const enabled = usePdsLabelEnabled()
  const hideBskyPds = usePdsLabelHideBskyPds()
  const {data, isLoading} = usePdsLabelQuery(enabled ? did : undefined)
  const {data: faviconUrl} = usePdsFaviconQuery(
    data && !data.isBsky && !data.isBridged ? data.pdsUrl : undefined,
  )

  const isBskyHandle =
    !!handle && (handle.endsWith('.bsky.social') || handle === 'bsky.social')

  if (!enabled) return null
  if (isLoading) return <PdsBadgeLoading size={size} isBsky={isBskyHandle} />
  if (!data) return null
  if (hideBskyPds && data.isBsky) return null

  return (
    <PdsBadgeInner
      pdsUrl={data.pdsUrl}
      faviconUrl={faviconUrl}
      isBsky={data.isBsky}
      isBridged={data.isBridged}
      size={size}
      interactive={interactive}
    />
  )
}

function PdsBadgeLoading({
  size,
  isBsky = false,
}: {
  size: 'lg' | 'md' | 'sm'
  isBsky?: boolean
}) {
  const {gtPhone} = useBreakpoints()
  let dimensions = 12
  if (size === 'lg') {
    dimensions = gtPhone ? 20 : 18
  } else if (size === 'md') {
    dimensions = 14
  }
  return (
    <View style={{width: dimensions, height: dimensions}}>
      <PdsBadgeIcon
        faviconUrl={undefined}
        isBsky={isBsky}
        isBridged={false}
        size={dimensions}
        borderRadius={Math.round(dimensions * 0.25)}
      />
    </View>
  )
}

function PdsBadgeInner({
  pdsUrl,
  faviconUrl,
  isBsky,
  isBridged,
  size,
  interactive,
}: {
  pdsUrl: string
  faviconUrl: string | undefined
  isBsky: boolean
  isBridged: boolean
  size: 'lg' | 'md' | 'sm'
  interactive: boolean
}) {
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const dialogControl = Dialog.useDialogControl()

  let dimensions = 12
  if (size === 'lg') {
    dimensions = gtPhone ? 20 : 18
  } else if (size === 'md') {
    dimensions = 14
  }

  const icon = (
    <PdsBadgeIcon
      faviconUrl={faviconUrl}
      isBsky={isBsky}
      isBridged={isBridged}
      size={dimensions}
      borderRadius={Math.round(dimensions * 0.25)}
    />
  )

  if (!interactive) {
    return (
      <View
        style={[
          a.justify_center,
          a.align_center,
          {width: dimensions, height: dimensions},
        ]}>
        {icon}
      </View>
    )
  }

  return (
    <>
      <Button
        label={_(msg`View PDS information`)}
        hitSlop={20}
        onPress={evt => {
          evt.preventDefault()
          dialogControl.open()
          if (IS_WEB) {
            ;(document.activeElement as HTMLElement | null)?.blur()
          }
        }}>
        {({hovered}) => (
          <View style={{width: dimensions, height: dimensions}}>
            <View
              style={[
                a.justify_center,
                a.align_center,
                a.transition_transform,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: [{scale: hovered ? 1.1 : 1}],
                },
              ]}>
              {icon}
            </View>
          </View>
        )}
      </Button>

      <PdsDialog
        control={dialogControl}
        pdsUrl={pdsUrl}
        faviconUrl={faviconUrl}
      />
    </>
  )
}

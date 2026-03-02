import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  usePdsLabelEnabled,
  usePdsLabelHideBskyPds,
} from '#/state/preferences/pds-label'
import {usePdsLabelQuery} from '#/state/queries/pds-label'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {FaviconOrGlobe, PdsDialog} from '#/components/PdsDialog'
import {IS_WEB} from '#/env'

export function PdsBadge({
  did,
  size,
  interactive = true,
}: {
  did: string
  size: 'lg' | 'md' | 'sm'
  interactive?: boolean
}) {
  const enabled = usePdsLabelEnabled()
  const hideBskyPds = usePdsLabelHideBskyPds()
  const {data, isLoading} = usePdsLabelQuery(enabled ? did : undefined)

  if (!enabled) return null
  if (isLoading) return <PdsBadgeLoading size={size} />
  if (!data) return null
  if (hideBskyPds && data.isBsky) return null

  return (
    <PdsBadgeInner
      pdsUrl={data.pdsUrl}
      faviconUrl={data.faviconUrl}
      isBsky={data.isBsky}
      isBridged={data.isBridged}
      size={size}
      interactive={interactive}
    />
  )
}

function PdsBadgeLoading({size}: {size: 'lg' | 'md' | 'sm'}) {
  const {gtPhone} = useBreakpoints()
  let dimensions = 12
  if (size === 'lg') {
    dimensions = gtPhone ? 20 : 18
  } else if (size === 'md') {
    dimensions = 14
  }
  return (
    <View style={{width: dimensions, height: dimensions}}>
      <FaviconOrGlobe
        faviconUrl=""
        isBsky={false}
        isBridged={false}
        size={dimensions}
        borderRadius={dimensions / 4}
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
  faviconUrl: string
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
    <FaviconOrGlobe
      faviconUrl={faviconUrl}
      isBsky={isBsky}
      isBridged={isBridged}
      size={dimensions}
      borderRadius={dimensions / 4}
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
          <View
            style={[
              a.justify_center,
              a.align_center,
              a.transition_transform,
              {
                width: dimensions,
                height: dimensions,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            {icon}
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

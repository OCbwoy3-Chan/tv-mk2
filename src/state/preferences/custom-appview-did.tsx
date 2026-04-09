import React from 'react'
import {reloadAppAsync} from 'expo'
import {isDid} from '@atproto/api'

import {IS_WEB} from '#/env'
import {device, useStorage} from '#/storage'

export function useCustomAppViewDid() {
  const [customAppViewDid = undefined, setCustomAppViewDid] = useStorage(
    device,
    ['customAppViewDid'],
  )

  return [customAppViewDid, setCustomAppViewDid] as const
}

export function useSetCustomAppViewDid() {
  const [, setCustomAppViewDid] = useCustomAppViewDid()

  return React.useCallback(
    (customAppViewDid: string | undefined) => {
      setCustomAppViewDid(customAppViewDid)

      if (IS_WEB) {
        window.location.reload()
      } else {
        void reloadAppAsync()
      }
    },
    [setCustomAppViewDid],
  )
}

export function readCustomAppViewDidUri() {
  const maybeDid = device.get(['customAppViewDid'])
  if (!maybeDid || !isDid(maybeDid)) {
    return undefined
  }

  return `${maybeDid}#bsky_appview`
}

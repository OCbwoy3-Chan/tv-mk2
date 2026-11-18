import {createContext, useContext, useState} from 'react'
import {type ModerationUI} from '@bsky/sdk/moderation'

import {
  type ModerationCauseDescription,
  useModerationCauseDescription,
} from '#/lib/moderation/useModerationCauseDescription'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {useDeltasPreferences} from '#/deltas/preferences'

type Context = {
  isContentVisible: boolean
  setIsContentVisible: (show: boolean) => void
  info: ModerationCauseDescription
  showInfoDialog: () => void
  meta: {
    isNoPwi: boolean
    allowOverride: boolean
  }
}

const Context = createContext<Context>({} as Context)
Context.displayName = 'HiderContext'

export const useHider = () => useContext(Context)

export function Outer({
  modui,
  isContentVisibleInitialState,
  allowOverride,
  isList = false,
  children,
}: React.PropsWithChildren<{
  isContentVisibleInitialState?: boolean
  allowOverride?: boolean
  isList?: boolean
  modui: ModerationUI | undefined
}>) {
  const control = useModerationDetailsDialogControl()
  const {showHiddenList} = useDeltasPreferences()
  const blur = modui?.blurs[0]
  const [isContentVisible, setIsContentVisible] = useState(
    isContentVisibleInitialState || !blur,
  )
  const info = useModerationCauseDescription(blur)

  const meta = {
    isNoPwi: Boolean(
      modui?.blurs.find(
        cause =>
          cause.type === 'label' &&
          cause.labelDef.identifier === '!no-unauthenticated',
      ),
    ),
    allowOverride:
      (isList && showHiddenList) || (allowOverride ?? !modui?.noOverride),
  }

  const showInfoDialog = () => {
    control.open()
  }

  const onSetContentVisible = (show: boolean) => {
    if (!meta.allowOverride) return
    setIsContentVisible(show)
  }

  const ctx = {
    isContentVisible,
    setIsContentVisible: onSetContentVisible,
    showInfoDialog,
    info,
    meta,
  }

  return (
    <Context.Provider value={ctx}>
      {children}
      <ModerationDetailsDialog control={control} modcause={blur} />
    </Context.Provider>
  )
}

export function Content({children}: {children: React.ReactNode}) {
  const ctx = useHider()
  return ctx.isContentVisible ? children : null
}

export function Mask({children}: {children: React.ReactNode}) {
  const ctx = useHider()
  return ctx.isContentVisible ? null : children
}
